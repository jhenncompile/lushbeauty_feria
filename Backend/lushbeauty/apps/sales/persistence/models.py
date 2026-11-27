import uuid

from django.db import models
from django.db.models import Case, F, Q, Value, When
from django.db.models.functions import Round
from django.utils import timezone

from shared.tenancy import SalonScopedManager

METODOS = [("EFECTIVO", "Efectivo"), ("QR", "QR"), ("TRANSFERENCIA", "Transferencia"), ("TARJETA", "Tarjeta")]


class Venta(models.Model):
    """Una venta. Nunca se borra: se anula con motivo. Referencias a otros módulos, por ID."""

    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE"
        CONFIRMADA = "CONFIRMADA"
        REQUIERE_REVISION = "REQUIERE_REVISION"
        ANULADA = "ANULADA"

    class Origen(models.TextChoices):
        WEB = "WEB"
        PWA_OFFLINE = "PWA_OFFLINE"
        IMPORTACION = "IMPORTACION"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    cliente_id = models.UUIDField(null=True, blank=True)
    registrado_por = models.UUIDField()
    uuid_cliente = models.UUIDField()  # clave de idempotencia (RN-01)
    fecha_servicio = models.DateTimeField()
    registrada_en = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    origen = models.CharField(max_length=20, choices=Origen.choices, default=Origen.WEB)
    motivo_anulacion = models.CharField(max_length=250, null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "venta"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "uuid_cliente"], name="uq_venta_01"),
            models.CheckConstraint(
                condition=~Q(estado="ANULADA") | Q(motivo_anulacion__isnull=False), name="ck_venta_01"
            ),
        ]


class LineaVenta(models.Model):
    """Copia inmutable del precio de lista, descuento e importe cobrado al vender (RN-02)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    venta = models.ForeignKey(Venta, on_delete=models.PROTECT, db_column="venta_id", related_name="lineas")
    servicio_id = models.UUIDField()
    especialista_id = models.UUIDField()
    liquidacion_id = models.UUIDField(null=True, blank=True)  # lo asigna payroll (F03)
    cantidad = models.IntegerField(default=1)
    precio_lista = models.DecimalField(max_digits=12, decimal_places=2)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    motivo_descuento = models.CharField(max_length=200, null=True, blank=True)
    importe_cobrado = models.DecimalField(max_digits=12, decimal_places=2)
    costo_materiales = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    propina = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metodo_propina = models.CharField(max_length=20, choices=METODOS, null=True, blank=True)
    # Snapshot de la comisión (RN-02, F02): regla, base, tasa e importe al vender. Nulos solo en
    # líneas anteriores a F02; toda línea nueva los trae.
    regla_comision_id = models.UUIDField(null=True, blank=True)
    base_comision = models.CharField(max_length=20, null=True, blank=True)
    tasa_comision = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    comision = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "linea_venta"
        constraints = [
            models.CheckConstraint(condition=Q(cantidad__gt=0), name="ck_linea_venta_01"),
            models.CheckConstraint(condition=Q(descuento__gte=0), name="ck_linea_venta_02"),
            models.CheckConstraint(condition=Q(importe_cobrado__gte=0), name="ck_linea_venta_03"),
            models.CheckConstraint(condition=Q(propina__gte=0), name="ck_linea_venta_04"),
            models.CheckConstraint(
                condition=Q(importe_cobrado=F("precio_lista") * F("cantidad") - F("descuento")),
                name="ck_linea_venta_05",
            ),
            models.CheckConstraint(
                condition=Q(descuento=0) | Q(motivo_descuento__isnull=False), name="ck_linea_venta_06"
            ),
            models.CheckConstraint(
                condition=Q(propina=0) | Q(metodo_propina__isnull=False), name="ck_linea_venta_08"
            ),
            models.CheckConstraint(  # el snapshot va completo o no va
                condition=(Q(regla_comision_id__isnull=True, base_comision__isnull=True,
                             tasa_comision__isnull=True, comision__isnull=True)
                           | Q(regla_comision_id__isnull=False, base_comision__isnull=False,
                               tasa_comision__isnull=False, comision__isnull=False)),
                name="ck_linea_venta_09",
            ),
            models.CheckConstraint(
                condition=Q(comision__isnull=True) | Q(comision=Round(
                    Case(When(base_comision="PRECIO_LISTA", then=F("precio_lista") * F("cantidad")),
                         default=F("importe_cobrado")) * F("tasa_comision"), 2)),
                name="ck_linea_venta_07",
            ),
        ]


class Pago(models.Model):
    """Permite pagos divididos (RN-04)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    venta = models.ForeignKey(Venta, on_delete=models.PROTECT, db_column="venta_id", related_name="pagos")
    metodo = models.CharField(max_length=20, choices=METODOS)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    pagado_en = models.DateTimeField(default=timezone.now)

    objects = SalonScopedManager()

    class Meta:
        db_table = "pago"
        constraints = [models.CheckConstraint(condition=Q(monto__gt=0), name="ck_pago_01")]
