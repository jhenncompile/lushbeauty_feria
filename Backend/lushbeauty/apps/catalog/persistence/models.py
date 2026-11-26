import uuid

from django.db import models
from django.db.models import F, Q

from shared.tenancy import SalonScopedManager


class Servicio(models.Model):
    """Catálogo oficial de servicios del salón."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    categoria = models.CharField(max_length=60)
    nombre = models.CharField(max_length=120)
    precio_lista = models.DecimalField(max_digits=12, decimal_places=2)
    costo_materiales = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "servicio"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "nombre"], name="uq_servicio_01"),
            models.CheckConstraint(condition=Q(precio_lista__gte=0), name="ck_servicio_01"),
            models.CheckConstraint(
                condition=Q(costo_materiales__isnull=True) | Q(costo_materiales__gte=0), name="ck_servicio_02"
            ),
        ]


class Cliente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    nombre = models.CharField(max_length=120)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "cliente"


class Especialista(models.Model):
    """Persona que atiende y recibe liquidación. `usuario_id` referencia a `identity` por ID."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    usuario_id = models.UUIDField(null=True, blank=True)
    nombre = models.CharField(max_length=120)
    sueldo_fijo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "especialista"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "usuario_id"], name="uq_especialista_usuario_id"),
            models.CheckConstraint(condition=Q(sueldo_fijo__gte=0), name="ck_especialista_01"),
        ]
