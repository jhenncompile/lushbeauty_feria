import uuid

from django.db import models
from django.db.models import F, Q

from shared.tenancy import SalonScopedManager


class CierreCaja(models.Model):
    """Una fila por salón, día y método de pago. `esperado` es una foto del momento del registro;
    la diferencia no se guarda: se calcula (declarado − esperado). Aprobado, no se modifica ni se borra."""

    METODOS = [("EFECTIVO", "Efectivo"), ("QR", "QR"), ("TRANSFERENCIA", "Transferencia"), ("TARJETA", "Tarjeta")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    fecha = models.DateField()
    metodo = models.CharField(max_length=20, choices=METODOS)
    esperado = models.DecimalField(max_digits=12, decimal_places=2)
    declarado = models.DecimalField(max_digits=12, decimal_places=2)
    justificacion = models.TextField(null=True, blank=True)
    registrado_por = models.UUIDField(null=True, blank=True)
    aprobado_por = models.UUIDField(null=True, blank=True)
    aprobado_en = models.DateTimeField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "cierre_caja"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "fecha", "metodo"], name="uq_cierre_caja_01"),
            models.CheckConstraint(
                condition=Q(aprobado_por__isnull=True) | Q(declarado=F("esperado")) | Q(justificacion__isnull=False),
                name="ck_cierre_caja_01",
            ),
            models.CheckConstraint(condition=Q(declarado__gte=0) & Q(esperado__gte=0), name="ck_cierre_caja_02"),
        ]
