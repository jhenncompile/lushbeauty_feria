"""Caso de uso: registrar una venta idempotente por `uuid_cliente` (RN-01)."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.audit.contracts import registrar_evento
from apps.catalog import contracts as catalogo
from apps.commissions import contracts as comisiones
from apps.identity import contracts as identidad
from apps.sales.domain import calculo
from apps.sales.persistence.models import LineaVenta, Pago, Venta
from apps.sales.services.errores import VentaRechazada
from shared import tenancy


@dataclass
class LineaEntrada:
    servicio_id: object
    especialista_id: object
    cantidad: int = 1
    descuento: Decimal = Decimal("0")
    motivo_descuento: str | None = None
    propina: Decimal = Decimal("0")
    metodo_propina: str | None = None


@dataclass
class PagoEntrada:
    metodo: str
    monto: Decimal


def _calcular(lineas: list[LineaEntrada], *, permisos: frozenset[str], usuario_id, fecha_servicio):
    """Resuelve catálogo y calcula, sin escribir nada. Devuelve [(entrada, servicio, calculada, comision)]."""
    dia = timezone.localdate(fecha_servicio)
    propia = None if "CATALOGO_GESTIONAR" in permisos else catalogo.especialista_de_usuario(usuario_id)
    resueltas = []
    for entrada in lineas:
        servicio = catalogo.obtener_servicio(entrada.servicio_id)
        if servicio is None or not servicio.activo:
            raise VentaRechazada("servicio_inexistente", "El servicio no existe o está inactivo.")
        if not catalogo.especialista_activa_existe(entrada.especialista_id):
            raise VentaRechazada("especialista_inexistente", "La especialista no existe o está inactiva.")
        if "CATALOGO_GESTIONAR" not in permisos and entrada.especialista_id != propia:
            raise VentaRechazada("especialista_ajena", "Solo puede registrar sus propios servicios.", 403)
        if entrada.propina < 0 or (entrada.propina > 0 and not entrada.metodo_propina):
            raise VentaRechazada("propina", "La propina no puede ser negativa y necesita su método de pago.")
        try:
            calculada = calculo.calcular_linea(
                servicio.precio_lista, entrada.cantidad, entrada.descuento, entrada.motivo_descuento
            )
        except calculo.ErrorDeVenta as error:
            raise VentaRechazada(error.codigo, str(error)) from error
        try:
            comision = comisiones.comision_de_linea(
                especialista_id=entrada.especialista_id, dia=dia, precio_lista=calculada.precio_lista,
                cantidad=calculada.cantidad, importe_cobrado=calculada.importe_cobrado,
            )
        except comisiones.SinReglaVigente as error:
            raise VentaRechazada("sin_regla_comision", str(error)) from error
        resueltas.append((entrada, servicio, calculada, comision))
    return resueltas


def registrar_venta(*, uuid_cliente, cliente_id, fecha_servicio, lineas: list[LineaEntrada],
                    pagos: list[PagoEntrada], usuario) -> tuple[Venta, bool]:
    """Devuelve (venta, creada). Un reintento con el mismo `uuid_cliente` devuelve la original."""
    existente = Venta.objects.filter(uuid_cliente=uuid_cliente).first()
    if existente is not None:
        return existente, False

    permisos = identidad.permisos_de(usuario)
    if "VENTA_REGISTRAR" not in permisos:
        raise VentaRechazada("sin_permiso", "No tiene permiso para registrar ventas.", 403)
    if cliente_id is not None and not catalogo.cliente_existe(cliente_id):
        raise VentaRechazada("cliente_inexistente", "La clienta no existe.")

    fecha_servicio = fecha_servicio or timezone.now()
    resueltas = _calcular(lineas, permisos=permisos, usuario_id=usuario.id, fecha_servicio=fecha_servicio)
    calculadas = [c for _, _, c, _ in resueltas]
    try:
        calculo.validar_pagos(calculadas, [(p.metodo, p.monto) for p in pagos])
    except calculo.ErrorDeVenta as error:
        raise VentaRechazada(error.codigo, str(error)) from error

    if calculo.descuento_excede_maximo(calculadas, identidad.descuento_maximo_del_salon()):
        raise VentaRechazada("descuento_sobre_maximo", "El descuento supera el máximo autorizado del salón.")
    umbral = Decimal(str(settings.VENTAS_UMBRAL_DESCUENTO_SIN_APROBACION))
    aprueba = "DESCUENTO_APROBAR" in permisos
    con_aprobacion = calculo.descuento_requiere_aprobacion(calculadas, umbral)
    if con_aprobacion and not aprueba:
        raise VentaRechazada("requiere_aprobacion", "Este descuento necesita la aprobación de la administradora.", 403)

    try:
        with transaction.atomic():
            venta = Venta.objects.create(
                salon_id=tenancy.salon_actual(), cliente_id=cliente_id, registrado_por=usuario.id,
                uuid_cliente=uuid_cliente, fecha_servicio=fecha_servicio,
                estado=Venta.Estado.CONFIRMADA, origen=Venta.Origen.WEB,
            )
            for entrada, servicio, c, com in resueltas:
                LineaVenta.objects.create(
                    salon_id=venta.salon_id, venta=venta, servicio_id=servicio.id,
                    especialista_id=entrada.especialista_id, cantidad=c.cantidad, precio_lista=c.precio_lista,
                    descuento=c.descuento, motivo_descuento=c.motivo_descuento, importe_cobrado=c.importe_cobrado,
                    costo_materiales=servicio.costo_materiales, propina=entrada.propina,
                    metodo_propina=entrada.metodo_propina, regla_comision_id=com.regla_id,
                    base_comision=com.base, tasa_comision=com.tasa, comision=com.comision,
                )
            for p in pagos:
                Pago.objects.create(salon_id=venta.salon_id, venta=venta, metodo=p.metodo, monto=p.monto)
            if con_aprobacion:
                registrar_evento("APROBAR", "descuento", entidad_id=venta.id, valor_nuevo={
                    "umbral": str(umbral), "descuento_total": str(sum(c.descuento for c in calculadas)),
                })
    except IntegrityError:
        # Carrera: otra petición con el mismo UUID ganó. La clave única es la fuente de verdad.
        ganadora = Venta.objects.filter(uuid_cliente=uuid_cliente).first()
        if ganadora is None:
            raise
        return ganadora, False
    return venta, True
