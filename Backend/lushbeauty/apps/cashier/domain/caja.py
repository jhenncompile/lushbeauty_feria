"""Conciliación de caja: pura, con Decimal, sin Django ni base de datos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

METODOS = ("EFECTIVO", "QR", "TRANSFERENCIA", "TARJETA")
CERO = Decimal("0.00")
CENTAVO = Decimal("0.01")

CUADRA, FALTA, SOBRA = "CUADRA", "FALTA", "SOBRA"


class ErrorDeCaja(ValueError):
    """Dato inválido al registrar o aprobar un cierre."""


def diferencia(declarado: Decimal, esperado: Decimal) -> Decimal:
    """Declarado − esperado: negativa = falta dinero, positiva = sobra."""
    return declarado - esperado


def estado_de(dif: Decimal) -> str:
    return CUADRA if dif == 0 else (FALTA if dif < 0 else SOBRA)


def totales_por_metodo(cobros) -> dict[str, Decimal]:
    """`cobros`: iterable de (método, monto). Devuelve los cuatro métodos, con 0 si no hubo."""
    totales = {m: CERO for m in METODOS}
    for metodo, monto in cobros:
        if metodo not in totales:
            raise ErrorDeCaja(f"Método de pago desconocido: {metodo}.")
        totales[metodo] += monto
    return totales


@dataclass(frozen=True)
class ResumenDia:
    dia: date
    por_metodo: dict[str, Decimal]
    total: Decimal
    descuentos: Decimal


def resumir(cobros, descuentos) -> list[ResumenDia]:
    """`cobros`: [(día, método, monto)]; `descuentos`: [(día, monto)]. Un resumen por día con movimiento."""
    dias = sorted({d for d, _, _ in cobros} | {d for d, _ in descuentos})
    resumen = []
    for dia in dias:
        por_metodo = totales_por_metodo((m, x) for d, m, x in cobros if d == dia)
        resumen.append(ResumenDia(
            dia, por_metodo, sum(por_metodo.values(), CERO), sum((x for d, x in descuentos if d == dia), CERO)))
    return resumen


def validar_declaracion(metodo: str, declarado: Decimal, esperado: Decimal, justificacion: str | None) -> str | None:
    """Devuelve la justificación limpia. Una diferencia sin justificar se rechaza ya al registrar."""
    if metodo not in METODOS:
        raise ErrorDeCaja(f"Método de pago desconocido: {metodo}.")
    if declarado < 0:
        raise ErrorDeCaja("El monto declarado no puede ser negativo.")
    if declarado != declarado.quantize(CENTAVO):
        raise ErrorDeCaja("El monto declarado admite a lo sumo 2 decimales.")
    texto = (justificacion or "").strip() or None
    if diferencia(declarado, esperado) != 0 and texto is None:
        raise ErrorDeCaja(f"{metodo}: hay diferencia y falta la justificación.")
    return texto
