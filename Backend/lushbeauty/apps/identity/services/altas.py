"""Alta de salones y usuarios."""

from __future__ import annotations

import uuid

from django.contrib.auth.hashers import make_password

from apps.identity.persistence.models import Rol, Salon, Usuario, UsuarioRol
from shared import tenancy


def crear_salon(nombre: str, *, moneda: str = "BOB", salon_id: uuid.UUID | None = None) -> uuid.UUID:
    salon_id = salon_id or uuid.uuid4()
    with tenancy.en_salon(salon_id):
        Salon.objects.create(id=salon_id, nombre=nombre, moneda=moneda)
    return salon_id


def crear_usuario(salon_id, *, nombre: str, email: str, password: str,
                  roles: list[str], asignado_por=None) -> uuid.UUID:
    with tenancy.en_salon(salon_id, asignado_por):
        usuario = Usuario.objects.create(
            salon_id=salon_id, nombre=nombre, email=email.strip().lower(),
            password_hash=make_password(password),
        )
        for rol in Rol.objects.filter(codigo__in=roles):
            UsuarioRol.objects.create(
                salon_id=salon_id, usuario=usuario, rol=rol, asignado_por=asignado_por
            )
    return usuario.id
