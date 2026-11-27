from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.contracts import TienePermiso
from apps.payroll.api import serializers as ser
from apps.payroll.services import nomina
from apps.payroll.services.nomina import NominaRechazada

PERMISO = "LIQUIDACION_APROBAR"  # hoy la gestiona solo la administradora; la vista propia llega con F03-T6


def _rechazo(error: NominaRechazada) -> Response:
    return Response({"detail": error.mensaje, "codigo": error.codigo}, status=error.estado)


class DeduccionesView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def post(self, request):
        datos = ser.DeduccionEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        try:
            m = nomina.registrar_deduccion(usuario_id=request.user.id, **datos.validated_data)
        except NominaRechazada as error:
            return _rechazo(error)
        return Response(ser.movimiento_salida(m), status=201)


class GenerarView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def post(self, request):
        datos = ser.GenerarEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        try:
            detalle = nomina.generar_borrador(**datos.validated_data)
        except NominaRechazada as error:
            return _rechazo(error)
        return Response(ser.detalle_salida(detalle), status=201)


class LiquidacionesView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request):
        filtro = ser.FiltroListado(data=request.query_params)
        filtro.is_valid(raise_exception=True)
        return Response([ser.liquidacion_salida(l) for l in nomina.listar(**filtro.validated_data)])


class LiquidacionDetalleView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request, liquidacion_id):
        liquidacion = nomina.obtener(liquidacion_id)
        if liquidacion is None:
            return Response({"detail": "No encontrada."}, status=404)
        if liquidacion.estado == liquidacion.Estado.BORRADOR:
            return Response(ser.detalle_salida(nomina.detalle_de_borrador(liquidacion)))
        return Response(ser.liquidacion_salida(liquidacion))  # el detalle de una aprobada llega con F03-T3
