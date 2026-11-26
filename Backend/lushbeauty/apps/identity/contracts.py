"""Interfaz pública de `identity`. Otros módulos importan solo de aquí."""

from apps.identity.domain.roles import ADMINISTRADORA, ESPECIALISTA, LECTOR, permisos_de_roles
from apps.identity.services.altas import crear_salon, crear_usuario
from apps.identity.services.sesion import Sesion, iniciar_sesion

__all__ = [
    "ADMINISTRADORA", "ESPECIALISTA", "LECTOR", "permisos_de_roles",
    "crear_salon", "crear_usuario", "Sesion", "iniciar_sesion",
]
