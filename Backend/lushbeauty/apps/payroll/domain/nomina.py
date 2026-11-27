"""Liquidación semanal: pura, con Decimal, sin Django ni base de datos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

CERO = Decimal("0.00")
CENTAVO = Decimal("0.01")
TIPOS_DEDUCCION = ("ADELANTO", "FALTA", "MATERIAL")
MAX_MOTIVO = 250


class ErrorDeNomina(ValueError):
    """Dato inválido al registrar una deducción o generar una liquidación."""


def periodo_de(fecha: date, dia_corte: int = 6) -> tuple[date, date]:
    """Semana de 7 días que contiene `fecha` y termina en `dia_corte` (0 = lunes … 6 = domingo).

    Valor inicial (decisión 6): lunes a domingo, `dia_corte = 6`. El salón puede cambiarlo.
    """
    if not 0 <= dia_corte <= 6:
        raise ErrorDeNomina("El día de corte debe estar entre 0 (lunes) y 6 (domingo).")
    fin = fecha + timedelta(days=(dia_corte - fecha.weekday()) % 7)
    return fin - timedelta(days=6), fin


@dataclass(frozen=True)
class Totales:
    sueldo_fijo: Decimal
    comision: Decimal
    propina: Decimal
    movimientos: Decimal
    neto: Decimal
    excedente: Decimal


def calcular(sueldo_fijo: Decimal, comision: Decimal, propina: Decimal, movimientos: Decimal) -> Totales:
    """neto − excedente = sueldo fijo + comisión + propina + movimientos (igual que la restricción de la base).

    Si el resultado es negativo, el neto es 0 y la diferencia queda como excedente que pasa al período siguiente.
    """
    bruto = sueldo_fijo + comision + propina + movimientos
    neto, excedente = (bruto, CERO) if bruto >= 0 else (CERO, -bruto)
    return Totales(sueldo_fijo, comision, propina, movimientos, neto, excedente)


def validar_deduccion(tipo: str, monto: Decimal, motivo: str | None) -> str:
    """Devuelve el motivo limpio. Una deducción es un monto negativo y siempre lleva motivo."""
    if tipo not in TIPOS_DEDUCCION:
        raise ErrorDeNomina(f"El tipo debe ser uno de {', '.join(TIPOS_DEDUCCION)}.")
    if monto >= 0:
        raise ErrorDeNomina("Una deducción es un monto negativo.")
    if monto != monto.quantize(CENTAVO):
        raise ErrorDeNomina("El monto admite a lo sumo 2 decimales.")
    texto = (motivo or "").strip()
    if not texto:
        raise ErrorDeNomina("El motivo de la deducción es obligatorio.")
    if len(texto) > MAX_MOTIVO:
        raise ErrorDeNomina(f"El motivo no puede pasar de {MAX_MOTIVO} caracteres.")
    return texto
