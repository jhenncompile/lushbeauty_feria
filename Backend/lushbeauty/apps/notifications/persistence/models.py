import uuid

from django.db import models
from django.db.models import Q
from django.utils import timezone

from shared.tenancy import SalonScopedManager


class EventoOutbox(models.Model):
    """Evento a publicar fuera del sistema. Se escribe en la misma transacción que la operación que lo origina.

    La clave única (salón, tipo, entidad) garantiza un solo aviso lógico por hecho. No se audita.
    """

    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE"
        ENVIADO = "ENVIADO"
        FALLIDO = "FALLIDO"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # también es el event_id
    salon_id = models.UUIDField()
    tipo = models.CharField(max_length=60)
    entidad_id = models.UUIDField()
    payload = models.JSONField()
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    intentos = models.IntegerField(default=0)
    ultimo_error = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField(default=timezone.now)
    enviado_en = models.DateTimeField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "evento_outbox"
        constraints = [
            models.UniqueConstraint(fields=["salon_id", "tipo", "entidad_id"], name="uq_evento_outbox_01"),
            models.CheckConstraint(condition=Q(intentos__gte=0), name="ck_evento_outbox_01"),
        ]
        indexes = [models.Index(fields=["creado_en"], condition=Q(estado="PENDIENTE"), name="ix_outbox_pendientes")]
