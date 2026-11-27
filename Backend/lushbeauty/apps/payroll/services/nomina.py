"""Casos de uso de nómina del salón activo. Lee ventas y catálogo solo por sus contratos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from uuid import UUID
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit.contracts import registrar_evento
from apps.catalog import contracts as catalogo
from apps.identity import contracts as identidad
from apps.payroll.domain import nomina as dominio
from apps.notifications import contracts as notificaciones
from apps.payroll.persistence.models import Liquidacion, MovimientoNomina
from apps.payroll.services import documentos
from apps.sales import contracts as ventas
from shared import tenancy

EXCEDENTE_PREVIO = "Excedente de la liquidación anterior"
EVENTO_LIQUIDACION_APROBADA = "liquidacion.aprobada"


class NominaRechazada(Exception):
    def __init__(self, codigo: str, mensaje: str, estado: int = 422):
        super().__init__(mensaje)
        self.codigo, self.mensaje, self.estado = codigo, mensaje, estado


@dataclass(frozen=True)
class Detalle:
    liquidacion: Liquidacion
    lineas: list  # LineaLiquidable
    movimientos: list[MovimientoNomina]
    lineas_sin_comision: int  # líneas anteriores a F02: aportan 0 y la administradora debe revisarlas


def _especialista(especialista_id):
    e = catalogo.obtener_especialista(especialista_id)
    if e is None:
        raise NominaRechazada("especialista_inexistente", "La especialista no existe.", 404)
    return e


def registrar_deduccion(*, especialista_id, tipo: str, monto, motivo: str, fecha: date, usuario_id) -> MovimientoNomina:
    """Deducción (monto negativo) con motivo. No se acepta sobre una semana ya aprobada."""
    _especialista(especialista_id)
    try:
        texto = dominio.validar_deduccion(tipo, Decimal(str(monto)), motivo)
    except dominio.ErrorDeNomina as error:
        raise NominaRechazada("deduccion", str(error)) from error
    inicio, _ = dominio.periodo_de(fecha, identidad.dia_corte_del_salon())
    if Liquidacion.objects.filter(especialista_id=especialista_id, periodo_inicio=inicio) \
            .exclude(estado=Liquidacion.Estado.BORRADOR).exists():
        raise NominaRechazada("periodo_cerrado", "Esa semana ya está aprobada: registra un ajuste, no una deducción.", 409)
    return MovimientoNomina.objects.create(
        salon_id=tenancy.salon_actual(), especialista_id=especialista_id, tipo=tipo, monto=Decimal(str(monto)),
        motivo=texto, fecha=fecha, registrado_por=usuario_id)


def _arrastrar_excedente(especialista_id, inicio: date) -> None:
    """Si la semana anterior (ya aprobada) terminó con excedente, entra como deducción en esta."""
    previa = Liquidacion.objects.filter(especialista_id=especialista_id, periodo_fin=inicio - timedelta(days=1)) \
        .exclude(estado=Liquidacion.Estado.BORRADOR).first()
    if previa is None or previa.excedente <= 0:
        return
    if MovimientoNomina.objects.filter(especialista_id=especialista_id, tipo=MovimientoNomina.Tipo.EXCEDENTE,
                                       fecha=inicio).exists():
        return
    MovimientoNomina.objects.create(
        salon_id=tenancy.salon_actual(), especialista_id=especialista_id, tipo=MovimientoNomina.Tipo.EXCEDENTE,
        monto=-previa.excedente, motivo=EXCEDENTE_PREVIO, fecha=inicio)


def _ajustar_ventas_anuladas(especialista_id, inicio: date) -> None:
    """Una venta anulada después de pagarse se descuenta como AJUSTE negativo en la primera semana posterior a la
    liquidación aprobada que la incluyó. Una sola vez por línea (clave única `ajuste_de_linea_id`)."""
    anuladas = ventas.lineas_anuladas_liquidadas(especialista_id)
    if not anuladas:
        return
    ya = set(MovimientoNomina.objects.filter(ajuste_de_linea_id__in=[a.linea_id for a in anuladas])
             .values_list("ajuste_de_linea_id", flat=True))
    liquidaciones = {l.id: l for l in Liquidacion.objects.filter(id__in={a.liquidacion_id for a in anuladas})}
    for a in anuladas:
        origen = liquidaciones.get(a.liquidacion_id)
        monto = -((a.comision or Decimal("0.00")) + a.propina)
        if a.linea_id in ya or origen is None or origen.periodo_fin >= inicio or monto == 0:
            continue
        MovimientoNomina.objects.create(
            salon_id=tenancy.salon_actual(), especialista_id=especialista_id, tipo=MovimientoNomina.Tipo.AJUSTE,
            monto=monto, fecha=inicio, ajuste_de_linea_id=a.linea_id,
            motivo=f"Venta anulada tras liquidarse ({origen.periodo_inicio} a {origen.periodo_fin}): "
                   f"{(a.motivo_anulacion or 'sin motivo')}"[:250])


def _movimientos_del_periodo(especialista_id, inicio: date, fin: date) -> list[MovimientoNomina]:
    return list(MovimientoNomina.objects.filter(especialista_id=especialista_id, fecha__gte=inicio, fecha__lte=fin,
                                                liquidacion_id__isnull=True).order_by("fecha", "id"))


def generar_borrador(*, especialista_id, fecha: date) -> Detalle:
    """Crea o recalcula el borrador de la semana que contiene `fecha`. Idempotente mientras sea BORRADOR;
    una semana ya aprobada se rechaza. No toca ventas: la aprobación (F03-T3) es la que las congela."""
    especialista = _especialista(especialista_id)
    inicio, fin = dominio.periodo_de(fecha, identidad.dia_corte_del_salon())
    with transaction.atomic():
        existente = Liquidacion.objects.select_for_update().filter(
            especialista_id=especialista_id, periodo_inicio=inicio).first()
        if existente is not None and existente.estado != Liquidacion.Estado.BORRADOR:
            raise NominaRechazada("ya_aprobada", "Esa semana ya está aprobada; no se recalcula.", 409)
        _arrastrar_excedente(especialista_id, inicio)
        _ajustar_ventas_anuladas(especialista_id, inicio)
        lineas = ventas.lineas_para_liquidar(especialista_id, inicio, fin)
        movimientos = _movimientos_del_periodo(especialista_id, inicio, fin)
        totales = dominio.calcular(
            especialista.sueldo_fijo,
            sum((l.comision or Decimal("0.00") for l in lineas), Decimal("0.00")),
            sum((l.propina for l in lineas), Decimal("0.00")),
            sum((m.monto for m in movimientos), Decimal("0.00")))
        valores = dict(periodo_fin=fin, sueldo_fijo=totales.sueldo_fijo, total_comision=totales.comision,
                       total_propina=totales.propina, total_movimientos=totales.movimientos,
                       neto=totales.neto, excedente=totales.excedente)
        if existente is None:
            liquidacion = Liquidacion.objects.create(
                salon_id=tenancy.salon_actual(), especialista_id=especialista_id, periodo_inicio=inicio, **valores)
        else:
            for campo, valor in valores.items():
                setattr(existente, campo, valor)
            existente.save()
            liquidacion = existente
    return Detalle(liquidacion, lineas, movimientos, sum(1 for l in lineas if l.comision is None))


def aprobar(liquidacion_id, *, usuario) -> Detalle:
    """Aprueba y congela la liquidación (RN-05): recalcula con lo último, liga las líneas y los movimientos a ella,
    la marca APROBADA y deja el evento `liquidacion.aprobada` en el outbox, todo en una transacción.

    El evento no lleva importes ni datos personales: solo el id de la liquidación y su período.
    """
    if "LIQUIDACION_APROBAR" not in identidad.permisos_de(usuario):
        raise NominaRechazada("sin_permiso", "No tiene permiso para aprobar liquidaciones.", 403)
    with transaction.atomic():
        liquidacion = Liquidacion.objects.select_for_update().filter(id=liquidacion_id).first()
        if liquidacion is None:
            raise NominaRechazada("no_encontrada", "La liquidación no existe.", 404)
        if liquidacion.estado != Liquidacion.Estado.BORRADOR:
            raise NominaRechazada("ya_aprobada", "La liquidación ya está aprobada.", 409)
        detalle = generar_borrador(especialista_id=liquidacion.especialista_id, fecha=liquidacion.periodo_inicio)
        liquidacion = detalle.liquidacion
        if detalle.lineas:
            try:
                ventas.asignar_liquidacion([l.linea_id for l in detalle.lineas], liquidacion.id)
            except ValueError as error:
                raise NominaRechazada("conflicto", str(error), 409) from error
        MovimientoNomina.objects.filter(id__in=[m.id for m in detalle.movimientos]).update(liquidacion_id=liquidacion.id)
        liquidacion.estado = Liquidacion.Estado.APROBADA
        liquidacion.aprobada_por, liquidacion.aprobada_en = usuario.id, timezone.now()
        liquidacion.save(update_fields=["estado", "aprobada_por", "aprobada_en"])  # el trigger audita antes/después
        registrar_evento("APROBAR", "liquidacion", entidad_id=liquidacion.id, valor_nuevo={
            "periodo_inicio": liquidacion.periodo_inicio.isoformat(), "periodo_fin": liquidacion.periodo_fin.isoformat()})
        notificaciones.publicar_evento(EVENTO_LIQUIDACION_APROBADA, liquidacion.id, {
            "periodo_inicio": liquidacion.periodo_inicio.isoformat(), "periodo_fin": liquidacion.periodo_fin.isoformat()})
    return detalle_de(liquidacion)


def marcar_pagada(liquidacion_id, *, comprobante_url: str | None = None) -> Liquidacion:
    """APROBADA → PAGADA. Es lo único (junto con el comprobante) que admite una liquidación aprobada."""
    with transaction.atomic():
        liquidacion = Liquidacion.objects.select_for_update().filter(id=liquidacion_id).first()
        if liquidacion is None:
            raise NominaRechazada("no_encontrada", "La liquidación no existe.", 404)
        if liquidacion.estado != Liquidacion.Estado.APROBADA:
            raise NominaRechazada("estado", "Solo una liquidación aprobada se marca como pagada.", 409)
        liquidacion.estado = Liquidacion.Estado.PAGADA
        liquidacion.comprobante_url = (comprobante_url or "").strip() or None
        liquidacion.save(update_fields=["estado", "comprobante_url"])
    return liquidacion


def detalle_de(liquidacion: Liquidacion) -> Detalle:
    """Detalle de una liquidación: en borrador se reproduce del período; aprobada, de lo que quedó ligado a ella."""
    if liquidacion.estado == Liquidacion.Estado.BORRADOR:
        return detalle_de_borrador(liquidacion)
    lineas = ventas.lineas_de_liquidacion(liquidacion.id)
    movimientos = list(MovimientoNomina.objects.filter(liquidacion_id=liquidacion.id).order_by("fecha", "id"))
    return Detalle(liquidacion, lineas, movimientos, sum(1 for l in lineas if l.comision is None))


def de_la_especialista(usuario_id) -> UUID | None:
    """La especialista vinculada a este usuario (None si el usuario no es especialista)."""
    return catalogo.especialista_de_usuario(usuario_id)


def liquidaciones_propias(especialista_id) -> list[Liquidacion]:
    """Solo las aprobadas o pagadas: un borrador es de trabajo de la administradora y aún puede cambiar."""
    return [l for l in listar(especialista_id=especialista_id) if l.estado != Liquidacion.Estado.BORRADOR]


def liquidacion_propia(liquidacion_id, especialista_id) -> Liquidacion | None:
    """None si no existe, es de otra especialista o sigue en borrador (el llamador no distingue los casos)."""
    l = Liquidacion.objects.filter(id=liquidacion_id, especialista_id=especialista_id).first()
    return None if l is None or l.estado == Liquidacion.Estado.BORRADOR else l


def comprobante(liquidacion: Liquidacion) -> bytes:
    """PDF del comprobante. Solo de una liquidación aprobada o pagada (un borrador aún puede cambiar)."""
    if liquidacion.estado == Liquidacion.Estado.BORRADOR:
        raise NominaRechazada("borrador", "Un borrador no tiene comprobante: apruébalo primero.", 409)
    detalle = detalle_de(liquidacion)
    especialista = catalogo.obtener_especialista(liquidacion.especialista_id)
    registrar_evento("EXPORTAR", "liquidacion", entidad_id=liquidacion.id, valor_nuevo={"formato": "pdf"})
    return documentos.comprobante_pdf(
        salon=identidad.nombre_del_salon(), especialista=especialista.nombre if especialista else "",
        liquidacion=liquidacion, lineas=detalle.lineas, movimientos=detalle.movimientos,
        servicios=catalogo.nombres_de_servicios(l.servicio_id for l in detalle.lineas))


def exportar_xlsx(*, desde: date | None = None, hasta: date | None = None) -> bytes:
    liquidaciones = listar(desde=desde, hasta=hasta)
    registrar_evento("EXPORTAR", "liquidacion", valor_nuevo={"formato": "xlsx", "filas": len(liquidaciones)})
    return documentos.resumen_xlsx(liquidaciones, catalogo.nombres_de_especialistas(l.especialista_id for l in liquidaciones))


def obtener(liquidacion_id) -> Liquidacion | None:
    return Liquidacion.objects.filter(id=liquidacion_id).first()


def listar(*, especialista_id=None, desde: date | None = None, hasta: date | None = None) -> list[Liquidacion]:
    qs = Liquidacion.objects.order_by("-periodo_inicio", "especialista_id")
    if especialista_id is not None:
        qs = qs.filter(especialista_id=especialista_id)
    if desde:
        qs = qs.filter(periodo_fin__gte=desde)
    if hasta:
        qs = qs.filter(periodo_inicio__lte=hasta)
    return list(qs)


def detalle_de_borrador(liquidacion: Liquidacion) -> Detalle:
    """Detalle por concepto reproducido desde las ventas y movimientos del período (para un BORRADOR)."""
    lineas = ventas.lineas_para_liquidar(liquidacion.especialista_id, liquidacion.periodo_inicio, liquidacion.periodo_fin)
    movimientos = _movimientos_del_periodo(liquidacion.especialista_id, liquidacion.periodo_inicio, liquidacion.periodo_fin)
    return Detalle(liquidacion, lineas, movimientos, sum(1 for l in lineas if l.comision is None))
