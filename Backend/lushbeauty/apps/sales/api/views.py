from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.contracts import TienePermiso
from apps.sales.api import serializers as ser
from apps.sales.services import anular, consultas, registrar
from apps.sales.services.errores import VentaRechazada


def _rechazo(error: VentaRechazada) -> Response:
    return Response({"detail": error.mensaje, "codigo": error.codigo}, status=error.estado)


class VentasView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "VENTA_REGISTRAR"

    def get(self, request):
        ventas = consultas.listar_ventas(request.query_params.get("estado"))
        return Response([ser.venta_salida(v) for v in ventas])

    def post(self, request):
        datos = ser.VentaEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        d = datos.validated_data
        try:
            venta, creada = registrar.registrar_venta(
                uuid_cliente=d["uuid_cliente"], cliente_id=d.get("cliente_id"),
                fecha_servicio=d.get("fecha_servicio"), usuario=request.user,
                lineas=[registrar.LineaEntrada(**linea) for linea in d["lineas"]],
                pagos=[registrar.PagoEntrada(**pago) for pago in d["pagos"]],
            )
        except VentaRechazada as error:
            return _rechazo(error)
        venta = consultas.obtener_venta(venta.id)
        return Response(ser.venta_salida(venta), status=201 if creada else 200)


class VentaDetalleView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "VENTA_REGISTRAR"

    def get(self, request, venta_id):
        venta = consultas.obtener_venta(venta_id)
        if venta is None:
            return Response({"detail": "No encontrada."}, status=404)
        return Response(ser.venta_salida(venta))


class AnularVentaView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "VENTA_ANULAR"

    def post(self, request, venta_id):
        datos = ser.AnulacionEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        try:
            anular.anular_venta(venta_id, datos.validated_data["motivo"])
        except VentaRechazada as error:
            return _rechazo(error)
        return Response(ser.venta_salida(consultas.obtener_venta(venta_id)))
