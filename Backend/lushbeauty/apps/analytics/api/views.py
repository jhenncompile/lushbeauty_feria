from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.api import serializers as ser
from apps.analytics.services import panel
from apps.analytics.services.panel import PanelRechazado
from apps.audit.contracts import registrar_acceso_denegado
from apps.catalog import contracts as catalogo
from apps.identity.contracts import permisos_de


def _denegar(request, permiso: str) -> Response:
    registrar_acceso_denegado(permiso=permiso, ruta=request.path, metodo=request.method,
                              direccion_ip=request.META.get("REMOTE_ADDR"))
    return Response({"detail": "No tienes permiso para esta operación."}, status=403)


class PanelView(APIView):
    """Quien tiene `REPORTES_VER` ve el salón (y puede filtrar por especialista). Una especialista
    ve solo lo suyo, siempre: el servidor fija su identidad y rechaza pedir la de otra."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        rango = ser.RangoEntrada(data=request.query_params)
        rango.is_valid(raise_exception=True)
        d = rango.validated_data
        permisos = permisos_de(request.user)
        if "REPORTES_VER" in permisos:
            filtro = d.get("especialista_id")
        elif "LIQUIDACION_VER_PROPIA" in permisos:
            propia = catalogo.especialista_de_usuario(request.user.id)
            if propia is None or d.get("especialista_id") not in (None, propia):
                return _denegar(request, "REPORTES_VER")
            filtro = propia
        else:
            return _denegar(request, "REPORTES_VER")
        try:
            resultado, nombres = panel.construir(d["desde"], d["hasta"], especialista_id=filtro)
        except PanelRechazado as error:
            return Response({"detail": error.mensaje, "codigo": error.codigo}, status=error.estado)
        return Response(ser.panel_salida(resultado, nombres))
