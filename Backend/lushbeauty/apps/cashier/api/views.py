from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cashier.api import serializers as ser
from apps.cashier.services import caja
from apps.cashier.services.caja import CierreRechazado
from apps.identity.contracts import TienePermiso

PERMISO = "CAJA_CERRAR"


def _rechazo(error: CierreRechazado) -> Response:
    return Response({"detail": error.mensaje, "codigo": error.codigo}, status=error.estado)


class ResumenView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request):
        rango = ser.RangoEntrada(data=request.query_params)
        rango.is_valid(raise_exception=True)
        try:
            dias = caja.resumen(rango.validated_data["desde"], rango.validated_data["hasta"])
        except CierreRechazado as error:
            return _rechazo(error)
        return Response([ser.resumen_salida(r) for r in dias])


class CierresView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request):
        filtro = ser.FiltroOpcional(data=request.query_params)
        filtro.is_valid(raise_exception=True)
        return Response([ser.cierre_salida(c) for c in caja.listar(
            filtro.validated_data.get("desde"), filtro.validated_data.get("hasta"))])

    def post(self, request):
        datos = ser.CierreEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        d = datos.validated_data
        try:
            filas = caja.registrar_cierre(
                d["fecha"], [caja.Declaracion(**x) for x in d["declaraciones"]], usuario_id=request.user.id)
        except CierreRechazado as error:
            return _rechazo(error)
        return Response([ser.cierre_salida(c) for c in filas], status=201)


class AprobarCierreView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def post(self, request, cierre_id):
        try:
            cierre = caja.aprobar_cierre(cierre_id, usuario=request.user)
        except CierreRechazado as error:
            return _rechazo(error)
        return Response(ser.cierre_salida(cierre))
