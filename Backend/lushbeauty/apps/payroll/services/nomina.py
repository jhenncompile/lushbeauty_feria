"""Casos de uso de nómina del salón activo. Lee ventas y catálogo solo por sus contratos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction

from apps.catalog import contracts as catalogo
from apps.identity import contracts as identidad
from apps.payroll.domain import nomina as dominio
from apps.payroll.persistence.models import Liquidacion, MovimientoNomina
from apps.sales import contracts as ventas
from shared import tenancy

EXCEDENTE_PREVIO = "Excedente de la liquidación anterior"


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
