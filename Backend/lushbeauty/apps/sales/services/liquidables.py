"""Líneas de venta que alimentan una liquidación (lectura para `payroll`)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from django.utils import timezone

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
