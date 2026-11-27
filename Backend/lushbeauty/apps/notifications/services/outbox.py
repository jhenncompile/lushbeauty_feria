"""Escritura de eventos. Un módulo de negocio llama a `publicar_evento` dentro de su propia transacción."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.db import connection, transaction

from apps.notifications.persistence.models import EventoOutbox
from shared import tenancy


class FueraDeTransaccion(RuntimeError):
    """El evento debe nacer en la misma transacción que el hecho que lo origina."""


@dataclass(frozen=True)
class EventoDTO:
    id: UUID
    salon_id: UUID
    tipo: str
    entidad_id: UUID
    payload: dict
    estado: str
    intentos: int


def a_dto(e: EventoOutbox) -> EventoDTO:
    return EventoDTO(e.id, e.salon_id, e.tipo, e.entidad_id, e.payload, e.estado, e.intentos)


def publicar_evento(tipo: str, entidad_id, payload: dict) -> tuple[EventoDTO, bool]:
    """Guarda el evento para el salón activo. Devuelve (evento, creado).

    Idempotente: el mismo (tipo, entidad) no se duplica (CP-08); la segunda llamada devuelve el original.
    Exige una transacción abierta: así el evento y el hecho se confirman o se deshacen juntos.
    """
    if not connection.in_atomic_block:
        raise FueraDeTransaccion("publicar_evento debe llamarse dentro de transaction.atomic().")
    salon = tenancy.salon_actual()
    if salon is None:
        raise ValueError("No hay salón activo.")
    with transaction.atomic():  # punto de guardado: un choque de clave no rompe la transacción de afuera
        evento, creado = EventoOutbox.objects.get_or_create(
            salon_id=salon, tipo=tipo, entidad_id=entidad_id, defaults={"payload": payload})
    return a_dto(evento), creado


def reintentar(evento_id) -> EventoDTO | None:
    """Devuelve un evento FALLIDO a la cola (HU-08). Un evento ENVIADO no se reenvía."""
    with transaction.atomic():
        e = EventoOutbox.objects.select_for_update().filter(id=evento_id, estado=EventoOutbox.Estado.FALLIDO).first()
        if e is None:
            return None
        e.estado, e.intentos, e.ultimo_error = EventoOutbox.Estado.PENDIENTE, 0, None
        e.save(update_fields=["estado", "intentos", "ultimo_error"])
    return a_dto(e)
