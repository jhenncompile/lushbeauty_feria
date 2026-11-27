"""Casos de uso de caja sobre el salón activo. Lee cobros de `sales` solo por su contrato."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit.contracts import registrar_evento
from apps.cashier.domain import caja as dominio
from apps.cashier.persistence.models import CierreCaja
from apps.identity import contracts as identidad
from apps.sales import contracts as ventas
from shared import tenancy


class CierreRechazado(Exception):
    """Error de negocio en caja. `estado` es el código HTTP sugerido."""

    def __init__(self, codigo: str, mensaje: str, estado: int = 422):
        super().__init__(mensaje)
        self.codigo, self.mensaje, self.estado = codigo, mensaje, estado


@dataclass
class Declaracion:
    metodo: str
    declarado: Decimal
    justificacion: str | None = None


def resumen(desde: date, hasta: date) -> list[dominio.ResumenDia]:
    """Cobros por método y descuentos por día; solo ventas confirmadas (las anuladas no cuentan)."""
    if hasta < desde:
        raise CierreRechazado("rango", "La fecha final no puede ser anterior a la inicial.", 400)
    return dominio.resumir(ventas.cobros_confirmados(desde, hasta), ventas.descuentos_confirmados(desde, hasta))


def listar(desde: date | None = None, hasta: date | None = None):
    qs = CierreCaja.objects.order_by("-fecha", "metodo")
    if desde:
        qs = qs.filter(fecha__gte=desde)
    if hasta:
        qs = qs.filter(fecha__lte=hasta)
    return list(qs)


def registrar_cierre(fecha: date, declaraciones: list[Declaracion], *, usuario_id) -> list[CierreCaja]:
    """Una fila por método. Un reintento antes de aprobar actualiza la fila (no la duplica)."""
    if fecha > timezone.localdate():
        raise CierreRechazado("fecha_futura", "No se puede cerrar la caja de un día futuro.")
    if not declaraciones:
        raise CierreRechazado("sin_declaraciones", "Declara al menos un método de pago.")
    if len({d.metodo for d in declaraciones}) != len(declaraciones):
        raise CierreRechazado("metodo_repetido", "Un método de pago aparece más de una vez.")
    esperados = dominio.totales_por_metodo((m, x) for _, m, x in ventas.cobros_confirmados(fecha, fecha))
    with transaction.atomic():
        filas = []
        for d in declaraciones:
            try:
                justificacion = dominio.validar_declaracion(d.metodo, d.declarado, esperados[d.metodo], d.justificacion)
            except dominio.ErrorDeCaja as error:
                raise CierreRechazado("declaracion", str(error)) from error
            existente = CierreCaja.objects.select_for_update().filter(fecha=fecha, metodo=d.metodo).first()
            if existente is not None and existente.aprobado_por is not None:
                raise CierreRechazado("ya_aprobado", f"El cierre de {d.metodo} del {fecha} ya está aprobado.", 409)
            valores = dict(esperado=esperados[d.metodo], declarado=d.declarado, justificacion=justificacion,
                           registrado_por=usuario_id)
            if existente is None:
                filas.append(CierreCaja.objects.create(salon_id=tenancy.salon_actual(), fecha=fecha,
                                                       metodo=d.metodo, **valores))
            else:
                for campo, valor in valores.items():
                    setattr(existente, campo, valor)
                existente.save()
                filas.append(existente)
    return filas


def aprobar_cierre(cierre_id, *, usuario) -> CierreCaja:
    """Aprueba un cierre. El evento `caja.cierre_aprobado` al outbox queda para F13 (decisión 9)."""
    if "CAJA_CERRAR" not in identidad.permisos_de(usuario):
        raise CierreRechazado("sin_permiso", "No tiene permiso para aprobar el cierre de caja.", 403)
    with transaction.atomic():
        cierre = CierreCaja.objects.select_for_update().filter(id=cierre_id).first()
        if cierre is None:
            raise CierreRechazado("no_encontrado", "El cierre no existe.", 404)
        if cierre.aprobado_por is not None:
            raise CierreRechazado("ya_aprobado", "El cierre ya está aprobado.", 409)
        if dominio.diferencia(cierre.declarado, cierre.esperado) != 0 and not (cierre.justificacion or "").strip():
            raise CierreRechazado("sin_justificacion", "Hay diferencia y falta la justificación.")
        cierre.aprobado_por, cierre.aprobado_en = usuario.id, timezone.now()
        cierre.save(update_fields=["aprobado_por", "aprobado_en"])  # el trigger audita antes/después
        registrar_evento("APROBAR", "cierre_caja", entidad_id=cierre.id, valor_nuevo={
            "fecha": cierre.fecha.isoformat(), "metodo": cierre.metodo,
            "diferencia": str(dominio.diferencia(cierre.declarado, cierre.esperado))})
    return cierre
