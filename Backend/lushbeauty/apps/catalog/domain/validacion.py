"""Reglas puras del catálogo (sin Django ni base de datos)."""

from decimal import Decimal

from shared.money import a_decimal, tiene_a_lo_sumo_centavos


class ErrorDeCatalogo(ValueError):
    pass


def validar_monto_no_negativo(valor, campo: str) -> Decimal:
    monto = a_decimal(valor)
    if monto < 0:
        raise ErrorDeCatalogo(f"{campo} no puede ser negativo.")
    if not tiene_a_lo_sumo_centavos(monto):
        raise ErrorDeCatalogo(f"{campo} admite como máximo 2 decimales.")
    return monto


def validar_nombre(nombre: str, campo: str = "nombre") -> str:
    limpio = (nombre or "").strip()
    if not limpio:
        raise ErrorDeCatalogo(f"{campo} es obligatorio.")
    return limpio
