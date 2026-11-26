from rest_framework.permissions import BasePermission

from apps.audit.contracts import registrar_acceso_denegado
from apps.identity.services.sesion import permisos_de


class TienePermiso(BasePermission):
    """Exige `view.permiso_requerido`. Un rechazo queda en la bitácora (ACCESO_DENEGADO)."""

    message = "No tienes permiso para esta operación."

    def has_permission(self, request, view):
        requerido = getattr(view, "permiso_requerido", None)
        if requerido is None:
            return True
        if requerido in permisos_de(request.user):
            return True
        registrar_acceso_denegado(
            permiso=requerido, ruta=request.path, metodo=request.method,
            direccion_ip=request.META.get("REMOTE_ADDR"),
        )
        return False
