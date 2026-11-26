"""Dinero: siempre `Decimal`, nunca `float`. Sin lógica de negocio."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

CENTAVO = Decimal("0.01")
CERO = Decimal("0.00")


def a_decimal(valor) -> Decimal:
    """Convierte sin pasar por float (un float se rechaza para no heredar su imprecisión)."""
    if isinstance(valor, float):
        raise TypeError("El dinero no se representa con float; use Decimal o str.")
    return valor if isinstance(valor, Decimal) else Decimal(str(valor))


def tiene_a_lo_sumo_centavos(valor: Decimal) -> bool:
    return valor == valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def redondear(valor: Decimal, modo: str = ROUND_HALF_UP) -> Decimal:
    """Redondeo explícito a centavos. Por defecto, mitad hacia arriba (igual que `round(x, 2)`
    de PostgreSQL). La regla definitiva es la decisión abierta 1 de la administradora."""
    return a_decimal(valor).quantize(CENTAVO, rounding=modo)
