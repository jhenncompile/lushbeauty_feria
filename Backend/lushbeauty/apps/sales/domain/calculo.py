"""Reglas de venta: importes, descuentos y cuadre de pagos (RN-03, RN-04).
Dominio puro: solo `Decimal`, sin Django ni base de datos."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from shared.money import CERO, a_decimal, tiene_a_lo_sumo_centavos

METODOS_PAGO = ("EFECTIVO", "QR", "TRANSFERENCIA", "TARJETA")


class ErrorDeVenta(ValueError):
    def __init__(self, codigo: str, mensaje: str):
        super().__init__(mensaje)
        self.codigo = codigo


@dataclass(frozen=True)
class LineaCalculada:
    precio_lista: Decimal
    cantidad: int
    descuento: Decimal
    motivo_descuento: str | None
    importe_cobrado: Decimal  # lista × cantidad − descuento (ck_linea_venta_05)

    @property
    def bruto(self) -> Decimal:
        return self.precio_lista * self.cantidad

    @property
    def fraccion_descuento(self) -> Decimal:
        return CERO if self.bruto == 0 else self.descuento / self.bruto


def _monto(valor, campo: str) -> Decimal:
    monto = a_decimal(valor)
    if not tiene_a_lo_sumo_centavos(monto):
        raise ErrorDeVenta("decimales", f"{campo} admite como máximo 2 decimales.")
    return monto


def calcular_linea(precio_lista, cantidad: int, descuento=0, motivo_descuento: str | None = None) -> LineaCalculada:
    lista = _monto(precio_lista, "El precio de lista")
    desc = _monto(descuento, "El descuento")
    motivo = (motivo_descuento or "").strip() or None
    if lista < 0:
        raise ErrorDeVenta("precio_negativo", "El precio de lista no puede ser negativo.")
    if cantidad <= 0:
        raise ErrorDeVenta("cantidad", "La cantidad debe ser mayor que cero.")
    if desc < 0:
        raise ErrorDeVenta("descuento_negativo", "El descuento no puede ser negativo.")
    if desc > 0 and motivo is None:
        raise ErrorDeVenta("motivo_descuento", "Todo descuento necesita un motivo.")
    if desc > lista * cantidad:
        raise ErrorDeVenta("descuento_excesivo", "El descuento no puede superar el importe de la línea.")
    return LineaCalculada(lista, cantidad, desc, motivo, lista * cantidad - desc)


def total_lineas(lineas: list[LineaCalculada]) -> Decimal:
    return sum((linea.importe_cobrado for linea in lineas), CERO)


def validar_pagos(lineas: list[LineaCalculada], pagos: list[tuple[str, Decimal]]) -> Decimal:
    """RN-04: los pagos igualan a las líneas. Devuelve el total."""
    if not lineas:
        raise ErrorDeVenta("sin_lineas", "La venta necesita al menos una línea.")
    if not pagos:
        raise ErrorDeVenta("sin_pagos", "La venta necesita al menos un pago.")
    pagado = CERO
    for metodo, monto in pagos:
        if metodo not in METODOS_PAGO:
            raise ErrorDeVenta("metodo_pago", f"Método de pago no válido: {metodo}.")
        monto = _monto(monto, "El pago")
        if monto <= 0:
            raise ErrorDeVenta("pago_no_positivo", "Cada pago debe ser mayor que cero.")
        pagado += monto
    total = total_lineas(lineas)
    if pagado != total:
        raise ErrorDeVenta("pagos_no_cuadran", f"Los pagos ({pagado}) no igualan las líneas ({total}).")
    return total


def descuento_requiere_aprobacion(lineas: list[LineaCalculada], umbral: Decimal) -> bool:
    return any(linea.fraccion_descuento > umbral for linea in lineas)


def descuento_excede_maximo(lineas: list[LineaCalculada], maximo: Decimal) -> bool:
    return any(linea.fraccion_descuento > maximo for linea in lineas)
