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


# --- Lectura agregada para caja (contrato con `cashier`) ---------------------------------------

def cobros_confirmados(desde, hasta) -> list[tuple]:
    """[(día, método, monto)] de pagos de ventas CONFIRMADAS con fecha de servicio en [desde, hasta]."""
    from datetime import datetime, time, timedelta

    from django.db.models import Sum
    from django.db.models.functions import TruncDate
    from django.utils import timezone

    zona = timezone.get_current_timezone()
    inicio = datetime.combine(desde, time.min, tzinfo=zona)
    fin = datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona)
    filas = (Pago.objects.filter(venta__estado=Venta.Estado.CONFIRMADA,
                                 venta__fecha_servicio__gte=inicio, venta__fecha_servicio__lt=fin)
             .annotate(dia=TruncDate("venta__fecha_servicio"))
             .values("dia", "metodo").annotate(total=Sum("monto")).order_by("dia", "metodo"))
    return [(f["dia"], f["metodo"], f["total"]) for f in filas]


def descuentos_confirmados(desde, hasta) -> list[tuple]:
    """[(día, descuento total)] de líneas de ventas CONFIRMADAS con descuento."""
    from datetime import datetime, time, timedelta

    from django.db.models import Sum
    from django.db.models.functions import TruncDate
    from django.utils import timezone

    zona = timezone.get_current_timezone()
    inicio = datetime.combine(desde, time.min, tzinfo=zona)
    fin = datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona)
    filas = (LineaVenta.objects.filter(venta__estado=Venta.Estado.CONFIRMADA, descuento__gt=0,
                                       venta__fecha_servicio__gte=inicio, venta__fecha_servicio__lt=fin)
             .annotate(dia=TruncDate("venta__fecha_servicio"))
             .values("dia").annotate(total=Sum("descuento")).order_by("dia"))
    return [(f["dia"], f["total"]) for f in filas]


def resumen_de_lineas(desde, hasta, especialista_id=None):
    """Totales de líneas de ventas CONFIRMADAS por (día, especialista) y la cantidad de ventas distintas.

    Devuelve (filas, ventas) con filas = [(día, especialista_id, servicios, bruto, descuento, cobrado,
    comisión, propina)]. `comisión` ignora las líneas anteriores a F02 (sin snapshot).
    """
    from datetime import datetime, time, timedelta

    from django.db.models import Count, DecimalField, F, Sum, Value
    from django.db.models.functions import Coalesce, TruncDate
    from django.utils import timezone

    zona = timezone.get_current_timezone()
    inicio = datetime.combine(desde, time.min, tzinfo=zona)
    fin = datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona)
    qs = LineaVenta.objects.filter(venta__estado=Venta.Estado.CONFIRMADA,
                                   venta__fecha_servicio__gte=inicio, venta__fecha_servicio__lt=fin)
    if especialista_id is not None:
        qs = qs.filter(especialista_id=especialista_id)
    cero = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
    filas = (qs.annotate(dia=TruncDate("venta__fecha_servicio"))
             .values("dia", "especialista_id")
             .annotate(servicios=Sum("cantidad"), bruto=Sum(F("precio_lista") * F("cantidad")),
                       descuento=Sum("descuento"), cobrado=Sum("importe_cobrado"),
                       comision=Coalesce(Sum("comision"), cero), propina=Sum("propina"))
             .order_by("dia", "especialista_id"))
    ventas = qs.aggregate(n=Count("venta_id", distinct=True))["n"]
    return ([(f["dia"], f["especialista_id"], f["servicios"], f["bruto"], f["descuento"], f["cobrado"],
              f["comision"], f["propina"]) for f in filas], ventas)
