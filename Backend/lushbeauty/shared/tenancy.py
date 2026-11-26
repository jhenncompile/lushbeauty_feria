"""Contexto de salón (inquilino) de la petición actual.

Dos capas de aislamiento, ambas obligatorias:
1. `SalonScopedManager` filtra las consultas del ORM por el salón activo.
2. RLS en PostgreSQL: la política lee `app.salon_id`, que `activar()` fija en la
   sesión. Si el manager falla o alguien usa SQL crudo, la base sigue filtrando.
"""

from __future__ import annotations

import uuid
from contextlib import contextmanager
from contextvars import ContextVar

from django.db import connection, models

_salon: ContextVar[uuid.UUID | None] = ContextVar("salon_id", default=None)
_usuario: ContextVar[uuid.UUID | None] = ContextVar("usuario_id", default=None)


def salon_actual() -> uuid.UUID | None:
    return _salon.get()


def usuario_actual() -> uuid.UUID | None:
    return _usuario.get()


def _aplicar_en_bd(salon: uuid.UUID | None, usuario: uuid.UUID | None) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT set_config('app.salon_id', %s, false), set_config('app.usuario_id', %s, false)",
            [str(salon) if salon else "", str(usuario) if usuario else ""],
        )


def activar(salon_id, usuario_id=None) -> None:
    salon = uuid.UUID(str(salon_id)) if salon_id else None
    usuario = uuid.UUID(str(usuario_id)) if usuario_id else None
    _salon.set(salon)
    _usuario.set(usuario)
    _aplicar_en_bd(salon, usuario)


def limpiar() -> None:
    if _salon.get() is not None or _usuario.get() is not None:
        activar(None, None)


@contextmanager
def en_salon(salon_id, usuario_id=None):
    """Activa un salón mientras dura el bloque y restaura el anterior al salir."""
    anterior = (_salon.get(), _usuario.get())
    activar(salon_id, usuario_id)
    try:
        yield
    finally:
        activar(*anterior)


class SalonScopedManager(models.Manager):
    """Manager que solo devuelve filas del salón activo. Sin salón activo, no devuelve nada."""

    def __init__(self, campo: str = "salon_id"):
        super().__init__()
        self.campo = campo

    def get_queryset(self):
        salon = salon_actual()
        qs = super().get_queryset()
        return qs.none() if salon is None else qs.filter(**{self.campo: salon})


def sql_aislamiento(tabla: str, columna: str = "salon_id") -> tuple[str, str]:
    """SQL (adelante, atrás) que activa RLS forzada y la política de aislamiento por salón."""
    adelante = f"""
        ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;
        ALTER TABLE {tabla} FORCE ROW LEVEL SECURITY;
        CREATE POLICY aislamiento_salon ON {tabla}
            USING ({columna} = nullif(current_setting('app.salon_id', true), '')::uuid)
            WITH CHECK ({columna} = nullif(current_setting('app.salon_id', true), '')::uuid);
    """
    atras = f"""
        DROP POLICY IF EXISTS aislamiento_salon ON {tabla};
        ALTER TABLE {tabla} NO FORCE ROW LEVEL SECURITY;
        ALTER TABLE {tabla} DISABLE ROW LEVEL SECURITY;
    """
    return adelante, atras
