"""Reglas de comisión: puras, con Decimal, sin Django ni base de datos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

PRECIO_LISTA = "PRECIO_LISTA"
PRECIO_COBRADO = "PRECIO_COBRADO"
BASES = (PRECIO_LISTA, PRECIO_COBRADO)
_CENTAVO = Decimal("0.01")
MAX_MOTIVO = 250


class ErrorDeComision(ValueError):
    """Dato inválido al definir una versión de comisión."""


class SinReglaVigente(Exception):
    """No hay ninguna regla (propia ni general) vigente en la fecha del servicio."""


@dataclass(frozen=True)
class Regla:
    id: UUID
    especialista_id: UUID | None  # None = regla general del salón
    porcentaje: Decimal  # fracción 0..1
    base: str
    desde: date
    hasta: date | None  # None = sin fin

    def vigente_en(self, dia: date) -> bool:
        return self.desde <= dia and (self.hasta is None or dia <= self.hasta)


@dataclass(frozen=True)
class ComisionCalculada:
    regla_id: UUID
    base: str
    tasa: Decimal
    comision: Decimal


def seleccionar(reglas, especialista_id, dia: date) -> Regla:
    """La regla propia vigente gana a la general vigente."""
    vigentes = [r for r in reglas if r.vigente_en(dia)]
    for r in vigentes:
        if r.especialista_id is not None and r.especialista_id == especialista_id:
            return r
    for r in vigentes:
        if r.especialista_id is None:
            return r
    raise SinReglaVigente(f"No hay regla de comisión vigente el {dia.isoformat()}.")


def calcular(regla: Regla, *, precio_lista: Decimal, cantidad: int, importe_cobrado: Decimal) -> ComisionCalculada:
    """Misma fórmula que la restricción `ck_linea_venta_07` de la base."""
    base = precio_lista * cantidad if regla.base == PRECIO_LISTA else importe_cobrado
    comision = (base * regla.porcentaje).quantize(_CENTAVO, rounding=ROUND_HALF_UP)
    return ComisionCalculada(regla.id, regla.base, regla.porcentaje, comision)


@dataclass(frozen=True)
class PlanDeVersion:
    """Qué hacer para publicar una versión nueva: cerrar (o no) la abierta del mismo ámbito."""

    cerrar_id: UUID | None
    cerrar_hasta: date | None


def planificar_version(existentes, *, porcentaje: Decimal, base: str, desde: date, motivo: str | None,
                       hoy: date) -> PlanDeVersion:
    """`existentes` son las reglas del mismo ámbito (misma especialista, o todas las generales)."""
    if not (Decimal("0") <= porcentaje <= Decimal("1")):
        raise ErrorDeComision("El porcentaje debe estar entre 0 y 1.")
    if base not in BASES:
        raise ErrorDeComision("La base debe ser PRECIO_LISTA o PRECIO_COBRADO.")
    motivo = (motivo or "").strip()
    if not motivo:
        raise ErrorDeComision("El motivo del cambio es obligatorio.")
    if len(motivo) > MAX_MOTIVO:
        raise ErrorDeComision(f"El motivo no puede pasar de {MAX_MOTIVO} caracteres.")
    existentes = list(existentes)
    if existentes and desde < hoy:
        raise ErrorDeComision("Una versión nueva no puede empezar en el pasado: el historial no se reescribe.")
    if any(r.desde >= desde for r in existentes):
        raise ErrorDeComision("Ya existe una versión que empieza en esa fecha o después.")
    fin = desde - timedelta(days=1)
    for r in existentes:
        if r.vigente_en(fin) and (r.hasta is None or r.hasta > fin):
            return PlanDeVersion(r.id, fin)
    return PlanDeVersion(None, None)
