from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.api.permissions import TienePermiso
from apps.identity.api.serializers import LoginSerializer, usuario_publico
from apps.identity.services import consultas, sesion


def _perfil(usuario) -> dict:
    roles = sesion.roles_de(usuario)
    return usuario_publico(usuario, roles, sesion.permisos_de(usuario))


class LoginView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        datos = LoginSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        resultado = sesion.iniciar_sesion(
            datos.validated_data["email"], datos.validated_data["password"],
            direccion_ip=request.META.get("REMOTE_ADDR"),
        )
        if resultado is None:
            return Response({"detail": "Credenciales incorrectas."}, status=401)
        return Response({
            "token": resultado.token,
            "usuario": {
                "id": resultado.usuario_id, "salon_id": resultado.salon_id,
                "nombre": resultado.nombre, "email": resultado.email,
                "roles": list(resultado.roles), "permisos": list(resultado.permisos),
            },
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_perfil(request.user))


class UsuariosView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "ADMIN_USUARIOS"

    def get(self, request):
        return Response([_perfil(u) for u in consultas.listar_usuarios()])


class UsuarioDetalleView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "ADMIN_USUARIOS"

    def get(self, request, usuario_id):
        usuario = consultas.obtener_usuario(usuario_id)
        if usuario is None:
            return Response({"detail": "No encontrado."}, status=404)
        return Response(_perfil(usuario))
