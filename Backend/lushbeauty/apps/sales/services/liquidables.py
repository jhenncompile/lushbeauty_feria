"""Líneas de venta que alimentan una liquidación (lectura para `payroll`)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from django.utils import timezone

from django.db import transaction

from apps.sales.persistence.models import LineaVenta, Venta


@dataclass(frozen=True)
class LineaLiquidable:
    linea_id: UUID
    venta_id: UUID
    dia: date
    servicio_id: UUID
    importe_cobrado: Decimal
    comision: Decimal | None  # None = línea anterior a F02, sin snapshot
    propina: Decimal


def lineas_para_liquidar(especialista_id, desde: date, hasta: date) -> list[LineaLiquidable]:
    """Líneas CONFIRMADAS de la especialista cuyo servicio cae en [desde, hasta] (zona del salón) y que
    todavía no pertenecen a una liquidación."""
    zona = timezone.get_current_timezone()
    inicio = datetime.combine(desde, time.min, tzinfo=zona)
    fin = datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona)
    qs = (LineaVenta.objects.select_related("venta")
          .filter(especialista_id=especialista_id, liquidacion_id__isnull=True,
                  venta__estado=Venta.Estado.CONFIRMADA,
                  venta__fecha_servicio__gte=inicio, venta__fecha_servicio__lt=fin)
          .order_by("venta__fecha_servicio", "id"))
    return [LineaLiquidable(l.id, l.venta_id, timezone.localtime(l.venta.fecha_servicio).date(), l.servicio_id,
                            l.importe_cobrado, l.comision, l.propina) for l in qs]


def _dto(l: LineaVenta) -> LineaLiquidable:
    return LineaLiquidable(l.id, l.venta_id, timezone.localtime(l.venta.fecha_servicio).date(), l.servicio_id,
                           l.importe_cobrado, l.comision, l.propina)


def lineas_de_liquidacion(liquidacion_id) -> list[LineaLiquidable]:
    """Líneas asignadas a una liquidación (el detalle de una aprobada)."""
    qs = LineaVenta.objects.select_related("venta").filter(liquidacion_id=liquidacion_id) \
        .order_by("venta__fecha_servicio", "id")
    return [_dto(l) for l in qs]


def asignar_liquidacion(linea_ids, liquidacion_id) -> None:
    """Liga las líneas a la liquidación. Falla si alguna ya pertenece a otra o dejó de existir (carrera)."""
    ids = list(linea_ids)
    with transaction.atomic():
        n = LineaVenta.objects.filter(id__in=ids, liquidacion_id__isnull=True).update(liquidacion_id=liquidacion_id)
        if n != len(ids):
            raise ValueError("Alguna línea ya está en otra liquidación o no existe.")


@dataclass(frozen=True)
class LineaAnuladaLiquidada:
    linea_id: UUID
    liquidacion_id: UUID
    venta_id: UUID
    comision: Decimal | None
    propina: Decimal
    motivo_anulacion: str | None


def lineas_anuladas_liquidadas(especialista_id) -> list[LineaAnuladaLiquidada]:
    """Líneas que se pagaron en una liquidación y cuya venta se anuló después."""
    qs = LineaVenta.objects.select_related("venta").filter(
        especialista_id=especialista_id, liquidacion_id__isnull=False, venta__estado=Venta.Estado.ANULADA
    ).order_by("venta__fecha_servicio", "id")
    return [LineaAnuladaLiquidada(l.id, l.liquidacion_id, l.venta_id, l.comision, l.propina, l.venta.motivo_anulacion)
            for l in qs]
