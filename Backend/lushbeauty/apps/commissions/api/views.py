import uuid

from django.db import IntegrityError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.commissions.api.serializers import VersionEntrada, regla_salida
from apps.commissions.domain.comision import ErrorDeComision
from apps.commissions.services import reglas
from apps.identity.contracts import TienePermiso

GESTION = "CATALOGO_GESTIONAR"


class ReglasView(APIView):
    """Historial de versiones (GET) y publicación de una versión nueva (POST). Solo quien gestiona políticas."""

    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = GESTION

    def get(self, request):
        especialista = request.query_params.get("especialista_id")
        try:
            filtro = uuid.UUID(especialista) if especialista else None
        except ValueError:
            return Response({"detail": "especialista_id inválido."}, status=400)
        generales = request.query_params.get("ambito") == "general"
        return Response([regla_salida(r) for r in reglas.listar(especialista_id=filtro, solo_generales=generales)])

    def post(self, request):
        datos = VersionEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        d = datos.validated_data
        try:
            regla = reglas.crear_version(
                porcentaje=d["porcentaje"], base=d["base"], desde=d["vigente_desde"], motivo=d["motivo"],
                especialista_id=d.get("especialista_id"),
            )
        except ErrorDeComision as error:
            return Response({"detail": str(error)}, status=422)
        except IntegrityError:
            return Response({"detail": "La vigencia se superpone con otra versión."}, status=409)
        return Response(regla_salida(regla), status=201)
