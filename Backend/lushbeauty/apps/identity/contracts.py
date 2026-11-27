"""Interfaz pública de `identity`. Otros módulos importan solo de aquí."""

from apps.identity.domain.roles import ADMINISTRADORA, ESPECIALISTA, LECTOR, permisos_de_roles
from apps.identity.api.permissions import TienePermiso
from apps.identity.services.altas import crear_salon, crear_usuario
from apps.identity.services.consultas import descuento_maximo_del_salon, obtener_usuario, salon_existe, dia_corte_del_salon, usuario_id_por_email
from apps.identity.services.sesion import Sesion, iniciar_sesion, permisos_de

__all__ = [
    "ADMINISTRADORA", "ESPECIALISTA", "LECTOR", "permisos_de_roles",
    "crear_salon", "crear_usuario", "Sesion", "iniciar_sesion",
    "TienePermiso", "permisos_de", "descuento_maximo_del_salon", "obtener_usuario", "salon_existe", "dia_corte_del_salon", "usuario_id_por_email",
]
