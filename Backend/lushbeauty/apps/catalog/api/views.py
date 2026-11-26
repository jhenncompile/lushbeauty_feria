from django.db import IntegrityError, transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.api import serializers as ser
from apps.catalog.domain.validacion import ErrorDeCatalogo
from apps.catalog.persistence.models import Cliente, Especialista, Servicio
from apps.catalog.services import gestion
from apps.identity.contracts import TienePermiso, permisos_de

GESTION = "CATALOGO_GESTIONAR"


def _gestor(request) -> bool:
    return GESTION in permisos_de(request.user)


def _guardar(accion):
    """Ejecuta una alta y traduce los errores de validación o de duplicado."""
    try:
        with transaction.atomic():
            return accion(), None
    except ErrorDeCatalogo as error:
        return None, Response({"detail": str(error)}, status=422)
    except IntegrityError:
        return None, Response({"detail": "Ya existe un registro con esos datos."}, status=409)


class ServiciosView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permisos_por_metodo = {"POST": GESTION}

    def get(self, request):
        gestor = _gestor(request)
        qs = Servicio.objects.order_by("categoria", "nombre")
        return Response([ser.servicio_salida(s, gestor=gestor) for s in qs])

    def post(self, request):
        datos = ser.ServicioEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        servicio, error = _guardar(lambda: gestion.crear_servicio(**datos.validated_data))
        return error or Response(ser.servicio_salida(servicio, gestor=True), status=201)


class ServicioDetalleView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = GESTION

    def patch(self, request, servicio_id):
        datos = ser.ServicioCambio(data=request.data)
        datos.is_valid(raise_exception=True)
        servicio, error = _guardar(lambda: gestion.actualizar_servicio(servicio_id, **datos.validated_data))
        if error:
            return error
        if servicio is None:
            return Response({"detail": "No encontrado."}, status=404)
        return Response(ser.servicio_salida(servicio, gestor=True))


class EspecialistasView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permisos_por_metodo = {"POST": GESTION}

    def get(self, request):
        gestor = _gestor(request)
        return Response([ser.especialista_salida(e, gestor=gestor) for e in Especialista.objects.order_by("nombre")])

    def post(self, request):
        datos = ser.EspecialistaEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        esp, error = _guardar(lambda: gestion.crear_especialista(**datos.validated_data))
        return error or Response(ser.especialista_salida(esp, gestor=True), status=201)


class ClientesView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "VENTA_REGISTRAR"

    def get(self, request):
        return Response([ser.cliente_salida(c) for c in Cliente.objects.order_by("nombre")])

    def post(self, request):
        datos = ser.ClienteEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        cliente, error = _guardar(lambda: gestion.crear_cliente(**datos.validated_data))
        return error or Response(ser.cliente_salida(cliente), status=201)
