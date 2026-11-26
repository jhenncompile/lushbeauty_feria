"""Autenticación: credenciales -> token firmado -> contexto de salón."""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core import signing
from django.db import connection

from apps.audit.contracts import registrar_evento
from apps.identity.persistence.models import Usuario, UsuarioRol
from apps.identity.domain.roles import permisos_de_roles
from shared import tenancy

_SAL = "lushbeauty.auth"
# Hash de relleno para igualar el tiempo de respuesta cuando el correo no existe.
_HASH_RELLENO = make_password("relleno-sin-uso")


@dataclass(frozen=True)
class Sesion:
    token: str
    usuario_id: str
    salon_id: str
    nombre: str
    email: str
    roles: tuple[str, ...]
    permisos: tuple[str, ...]


def roles_de(usuario: Usuario) -> list[str]:
    return list(
        UsuarioRol.objects.filter(usuario_id=usuario.id).values_list("rol__codigo", flat=True)
    )


def permisos_de(usuario: Usuario) -> frozenset[str]:
    return permisos_de_roles(roles_de(usuario))


def emitir_token(usuario: Usuario) -> str:
    return signing.dumps({"u": str(usuario.id), "s": str(usuario.salon_id)}, salt=_SAL)


def leer_token(token: str) -> tuple[str, str] | None:
    try:
        datos = signing.loads(token, salt=_SAL, max_age=settings.AUTH_TOKEN_MAX_AGE)
        return datos["s"], datos["u"]
    except (signing.BadSignature, KeyError):
        return None


def _buscar_para_login(email: str) -> Usuario | None:
    """El correo es único por salón; la política `acceso_login` de RLS permite ver solo
    las filas con ese correo mientras dura la búsqueda."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.login_email', %s, false)", [email])
    try:
        coincidencias = list(Usuario._base_manager.filter(email=email)[:2])
    finally:
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.login_email', '', false)")
    return coincidencias[0] if len(coincidencias) == 1 else None


def iniciar_sesion(email: str, password: str, *, direccion_ip: str | None = None) -> Sesion | None:
    usuario = _buscar_para_login(email.strip().lower())
    hash_a_probar = usuario.password_hash if usuario else _HASH_RELLENO
    clave_ok = check_password(password, hash_a_probar)
    if usuario is None or not clave_ok or not usuario.activo:
        return None

    tenancy.activar(usuario.salon_id, usuario.id)
    registrar_evento("INICIAR_SESION", "usuario", entidad_id=usuario.id, direccion_ip=direccion_ip)
    roles = roles_de(usuario)
    return Sesion(
        token=emitir_token(usuario), usuario_id=str(usuario.id), salon_id=str(usuario.salon_id),
        nombre=usuario.nombre, email=usuario.email, roles=tuple(roles),
        permisos=tuple(sorted(permisos_de_roles(roles))),
    )
