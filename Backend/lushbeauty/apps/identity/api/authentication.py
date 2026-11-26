from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from apps.identity.services import consultas, sesion
from shared import tenancy


class TokenAuthentication(BaseAuthentication):
    """`Authorization: Bearer <token>`. Fija el salón activo antes de cualquier consulta."""

    palabra = b"bearer"

    def authenticate(self, request):
        partes = get_authorization_header(request).split()
        if not partes or partes[0].lower() != self.palabra:
            return None
        if len(partes) != 2:
            raise AuthenticationFailed("Token mal formado.")
        datos = sesion.leer_token(partes[1].decode())
        if datos is None:
            raise AuthenticationFailed("Token inválido o vencido.")
        salon_id, usuario_id = datos
        tenancy.activar(salon_id, usuario_id)
        usuario = consultas.obtener_usuario(usuario_id)
        if usuario is None or not usuario.activo:
            raise AuthenticationFailed("Usuario inexistente o inactivo.")
        return usuario, partes[1].decode()

    def authenticate_header(self, request):
        return "Bearer"
