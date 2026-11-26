from django.db.models import Prefetch

from apps.sales.persistence.models import LineaVenta, Pago, Venta


def _base():
    return Venta.objects.prefetch_related(
        Prefetch("lineas", queryset=LineaVenta.objects.order_by("id")),
        Prefetch("pagos", queryset=Pago.objects.order_by("pagado_en", "id")),
    )


def listar_ventas(estado: str | None = None):
    qs = _base().order_by("-fecha_servicio")
    return qs.filter(estado=estado) if estado else qs


def obtener_venta(venta_id):
    return _base().filter(id=venta_id).first()
