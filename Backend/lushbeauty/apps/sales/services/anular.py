"""Anulación como ajuste auditado: la venta se conserva con su historial (HU-10, RN-05)."""

from __future__ import annotations

from django.db import transaction

from apps.sales.persistence.models import LineaVenta, Venta
from apps.sales.services.errores import VentaRechazada


def anular_venta(venta_id, motivo: str) -> Venta:
    motivo = (motivo or "").strip()
    if not motivo:
        raise VentaRechazada("motivo_anulacion", "La anulación necesita un motivo.")
    with transaction.atomic():
        venta = Venta.objects.select_for_update().filter(id=venta_id).first()
        if venta is None:
            raise VentaRechazada("no_encontrada", "La venta no existe.", 404)
        if venta.estado == Venta.Estado.ANULADA:
            raise VentaRechazada("ya_anulada", "La venta ya está anulada.", 409)
        if LineaVenta.objects.filter(venta=venta, liquidacion_id__isnull=False).exists():
            # Pendiente en F03: generar un MovimientoNomina tipo AJUSTE en la liquidación abierta siguiente.
            raise VentaRechazada(
                "venta_liquidada", "La venta ya está en una liquidación; requiere un ajuste de nómina.", 409
            )
        venta.estado = Venta.Estado.ANULADA
        venta.motivo_anulacion = motivo[:250]
        venta.save(update_fields=["estado", "motivo_anulacion"])  # el trigger audita antes/después
    return venta
