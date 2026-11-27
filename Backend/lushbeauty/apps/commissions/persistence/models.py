import uuid

from django.db import models
from django.db.models import F, Q

from shared.tenancy import SalonScopedManager


class ReglaComision(models.Model):
    """Versión de una política de comisión. Solo `vigente_hasta` puede cambiar, y una vez.

    `especialista_id` vacío = regla general del salón. Referencia por ID, sin ForeignKey.
    La no superposición de vigencias la impone una restricción EXCLUDE de la base (ver migración).
    """

    class Base(models.TextChoices):
        PRECIO_LISTA = "PRECIO_LISTA"
        PRECIO_COBRADO = "PRECIO_COBRADO"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    especialista_id = models.UUIDField(null=True, blank=True)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=4)
    base = models.CharField(max_length=20, choices=Base.choices)
    vigente_desde = models.DateField()
    vigente_hasta = models.DateField(null=True, blank=True)
    motivo = models.CharField(max_length=250)
    creada_por = models.UUIDField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "regla_comision"
        constraints = [
            models.CheckConstraint(condition=Q(porcentaje__gte=0) & Q(porcentaje__lte=1), name="ck_regla_comision_01"),
            models.CheckConstraint(
                condition=Q(vigente_hasta__isnull=True) | Q(vigente_hasta__gte=F("vigente_desde")),
                name="ck_regla_comision_02",
            ),
        ]
