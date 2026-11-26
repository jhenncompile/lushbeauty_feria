import uuid

from django.db import models
from django.utils import timezone

from shared.tenancy import SalonScopedManager


class Auditoria(models.Model):
    """Bitácora de solo inserción. Referencia salón y usuario por ID, sin ForeignKey."""

    class Accion(models.TextChoices):
        CREAR = "CREAR"
        MODIFICAR = "MODIFICAR"
        ELIMINAR = "ELIMINAR"
        APROBAR = "APROBAR"
        INICIAR_SESION = "INICIAR_SESION"
        ACCESO_DENEGADO = "ACCESO_DENEGADO"
        CONSULTAR = "CONSULTAR"
        EXPORTAR = "EXPORTAR"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    usuario_id = models.UUIDField(null=True, blank=True)
    permiso_id = models.UUIDField(null=True, blank=True)
    accion = models.CharField(max_length=20, choices=Accion.choices)
    entidad = models.CharField(max_length=60)
    entidad_id = models.UUIDField(null=True, blank=True)
    valor_anterior = models.JSONField(null=True, blank=True)
    valor_nuevo = models.JSONField(null=True, blank=True)
    direccion_ip = models.GenericIPAddressField(null=True, blank=True)
    ocurrido_en = models.DateTimeField(default=timezone.now)

    objects = SalonScopedManager()

    class Meta:
        db_table = "auditoria"
        ordering = ["-ocurrido_en"]
