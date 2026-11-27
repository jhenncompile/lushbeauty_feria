from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.contracts import registrar_acceso_denegado
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


def _denegar(request, permiso: str) -> Response:
    registrar_acceso_denegado(permiso=permiso, ruta=request.path, metodo=request.method,
                              direccion_ip=request.META.get("REMOTE_ADDR"))
    return Response({"detail": "No tienes permiso para esta operación."}, status=403)


class MisLiquidacionesView(APIView):
    """«Mi liquidación» (HU-09): la especialista ve solo las suyas, aprobadas o pagadas."""

    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "LIQUIDACION_VER_PROPIA"

    def get(self, request):
        propia = nomina.de_la_especialista(request.user.id)
        if propia is None:
            return _denegar(request, "LIQUIDACION_VER_PROPIA")
        return Response([ser.liquidacion_salida(l) for l in nomina.liquidaciones_propias(propia)])


class MiLiquidacionDetalleView(APIView):
    """CP-06: pedir la liquidación de otra persona (o una que no existe o no está aprobada) da 403 y queda registrado."""

    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "LIQUIDACION_VER_PROPIA"

    def get(self, request, liquidacion_id):
        propia = nomina.de_la_especialista(request.user.id)
        liquidacion = None if propia is None else nomina.liquidacion_propia(liquidacion_id, propia)
        if liquidacion is None:
            return _denegar(request, "LIQUIDACION_VER_PROPIA")
        return Response(ser.detalle_salida(nomina.detalle_de(liquidacion)))


def _pdf(contenido: bytes, liquidacion) -> HttpResponse:
    respuesta = HttpResponse(contenido, content_type="application/pdf")
    respuesta["Content-Disposition"] = f'attachment; filename="liquidacion-{liquidacion.periodo_inicio}.pdf"'
    respuesta["Cache-Control"] = "private, no-store"  # es un documento personal: nada de cachés compartidas
    return respuesta


class ComprobanteView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request, liquidacion_id):
        liquidacion = nomina.obtener(liquidacion_id)
        if liquidacion is None:
            return Response({"detail": "No encontrada."}, status=404)
        try:
            return _pdf(nomina.comprobante(liquidacion), liquidacion)
        except NominaRechazada as error:
            return _rechazo(error)


class MiComprobanteView(APIView):
    """RN-08: el PDF solo lo obtiene su destinataria; cualquier otro caso es 403 y queda registrado."""

    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = "LIQUIDACION_VER_PROPIA"

    def get(self, request, liquidacion_id):
        propia = nomina.de_la_especialista(request.user.id)
        liquidacion = None if propia is None else nomina.liquidacion_propia(liquidacion_id, propia)
        if liquidacion is None:
            return _denegar(request, "LIQUIDACION_VER_PROPIA")
        return _pdf(nomina.comprobante(liquidacion), liquidacion)


class ExportarView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def get(self, request):
        filtro = ser.FiltroPeriodo(data=request.query_params)
        filtro.is_valid(raise_exception=True)
        contenido = nomina.exportar_xlsx(**filtro.validated_data)
        respuesta = HttpResponse(contenido, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        respuesta["Content-Disposition"] = 'attachment; filename="liquidaciones.xlsx"'
        respuesta["Cache-Control"] = "private, no-store"
        return respuesta


class AprobarView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def post(self, request, liquidacion_id):
        try:
            detalle = nomina.aprobar(liquidacion_id, usuario=request.user)
        except NominaRechazada as error:
            return _rechazo(error)
        return Response(ser.detalle_salida(detalle))


class PagarView(APIView):
    permission_classes = [IsAuthenticated, TienePermiso]
    permiso_requerido = PERMISO

    def post(self, request, liquidacion_id):
        datos = ser.PagoEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        try:
            liquidacion = nomina.marcar_pagada(liquidacion_id, comprobante_url=datos.validated_data.get("comprobante_url"))
        except NominaRechazada as error:
            return _rechazo(error)
        return Response(ser.liquidacion_salida(liquidacion))


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
        return Response(ser.detalle_salida(nomina.detalle_de(liquidacion)))
