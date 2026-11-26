"""Consulta de la bitácora del salón activo."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from apps.audit.persistence.models import Auditoria

LIMITE_MAXIMO = 500


@dataclass(frozen=True)
class EntradaHistorial:
    id: UUID
    ocurrido_en: datetime
    usuario_id: UUID | None
    accion: str
    entidad: str
    entidad_id: UUID | None
    valor_anterior: dict | None
    valor_nuevo: dict | None
    direccion_ip: str | None


def historial(*, usuario_id=None, accion: str | None = None, limite: int = 100) -> list[EntradaHistorial]:
    """Entradas más recientes primero. El salón lo acota el manager y la RLS."""
    qs = Auditoria.objects.all()
    if usuario_id is not None:
        qs = qs.filter(usuario_id=usuario_id)
    if accion:
        qs = qs.filter(accion=accion)
    limite = max(1, min(limite, LIMITE_MAXIMO))
    return [
        EntradaHistorial(a.id, a.ocurrido_en, a.usuario_id, a.accion, a.entidad, a.entidad_id,
                         a.valor_anterior, a.valor_nuevo, a.direccion_ip)
        for a in qs.order_by("-ocurrido_en")[:limite]
    ]
