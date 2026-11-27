import uuid

from django.db import models
from django.db.models import F, Q

from shared.tenancy import SalonScopedManager


class Liquidacion(models.Model):
    """Liquidación semanal de una especialista. Referencias a otros módulos, por ID.

    Aprobada, solo se le puede marcar como pagada y adjuntar el comprobante (trigger).
    El detalle por concepto no se guarda: se reproduce desde las líneas y movimientos del período.
    """

    class Estado(models.TextChoices):
        BORRADOR = "BORRADOR"
        APROBADA = "APROBADA"
        PAGADA = "PAGADA"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    especialista_id = models.UUIDField()
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.BORRADOR)
    sueldo_fijo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_comision = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_propina = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_movimientos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    excedente = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    aprobada_por = models.UUIDField(null=True, blank=True)
    aprobada_en = models.DateTimeField(null=True, blank=True)
    comprobante_url = models.CharField(max_length=300, null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "liquidacion"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "especialista_id", "periodo_inicio"], name="uq_liquidacion_01"),
            models.CheckConstraint(condition=Q(periodo_fin__gte=F("periodo_inicio")), name="ck_liquidacion_01"),
            models.CheckConstraint(condition=Q(neto__gte=0), name="ck_liquidacion_02"),
            models.CheckConstraint(condition=Q(excedente__gte=0), name="ck_liquidacion_03"),
            models.CheckConstraint(condition=Q(neto=0) | Q(excedente=0), name="ck_liquidacion_04"),
            models.CheckConstraint(
                condition=Q(neto=F("sueldo_fijo") + F("total_comision") + F("total_propina")
                            + F("total_movimientos") + F("excedente")),
                name="ck_liquidacion_05"),
            models.CheckConstraint(condition=Q(estado="BORRADOR") | Q(aprobada_por__isnull=False), name="ck_liquidacion_06"),
        ]


class MovimientoNomina(models.Model):
    """Deducciones (monto negativo), excedentes arrastrados y ajustes. Nunca se borra: se corrige con otro movimiento."""

    class Tipo(models.TextChoices):
        ADELANTO = "ADELANTO"
        FALTA = "FALTA"
        MATERIAL = "MATERIAL"
        EXCEDENTE = "EXCEDENTE"
        AJUSTE = "AJUSTE"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    especialista_id = models.UUIDField()
    liquidacion_id = models.UUIDField(null=True, blank=True)  # lo fija la aprobación (F03-T3)
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    motivo = models.CharField(max_length=250)
    fecha = models.DateField()
    registrado_por = models.UUIDField(null=True, blank=True)
    # Línea de venta anulada que este AJUSTE descuenta (por ID, sin ForeignKey). Única: un ajuste por línea.
    ajuste_de_linea_id = models.UUIDField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "movimiento_nomina"
        constraints = [
            models.UniqueConstraint(fields=["ajuste_de_linea_id"], condition=Q(ajuste_de_linea_id__isnull=False),
                                    name="uq_movimiento_ajuste_linea"),
            models.CheckConstraint(condition=~Q(monto=0), name="ck_movimiento_nomina_01"),
            models.CheckConstraint(condition=Q(tipo="AJUSTE") | Q(monto__lt=0), name="ck_movimiento_nomina_02"),
        ]
