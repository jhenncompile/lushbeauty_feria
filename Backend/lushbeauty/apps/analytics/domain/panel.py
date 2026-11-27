"""Consolidación del panel financiero: pura, con Decimal, sin Django ni base de datos."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

CERO = Decimal("0.00")
METODOS = ("EFECTIVO", "QR", "TRANSFERENCIA", "TARJETA")


@dataclass(frozen=True)
class FilaLineas:
    dia: date
    especialista_id: UUID
    servicios: int
    bruto: Decimal
    descuento: Decimal
    cobrado: Decimal
    comision: Decimal
    propina: Decimal


@dataclass
class Totales:
    servicios: int = 0
    bruto: Decimal = CERO
    descuentos: Decimal = CERO
    cobrado: Decimal = CERO
    comisiones: Decimal = CERO
    propinas: Decimal = CERO

    def sumar(self, f: FilaLineas) -> None:
        self.servicios += f.servicios
        self.bruto += f.bruto
        self.descuentos += f.descuento
        self.cobrado += f.cobrado
        self.comisiones += f.comision
        self.propinas += f.propina


@dataclass
class Panel:
    hay_datos: bool
    ventas: int
    totales: Totales
    descuento_pct: Decimal | None  # fracción 0..1 del bruto; None si no hubo bruto
    por_especialista: dict[UUID, Totales] = field(default_factory=dict)
    por_dia: dict[date, Decimal] = field(default_factory=dict)  # cobrado por día
    por_metodo: dict[str, Decimal] | None = None  # None si no aplica (vista de una especialista)


def porcentaje(parte: Decimal, total: Decimal) -> Decimal | None:
    if total == 0:
        return None
    return (parte / total).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def consolidar(filas, *, ventas: int, cobros=None) -> Panel:
    """`filas`: FilaLineas de ventas confirmadas. `cobros`: [(día, método, monto)] o None.

    Lo cobrado sale de los importes de líneas confirmadas; por RN-04 coincide con los pagos
    confirmados, y `por_metodo` sale de los pagos. Nada no confirmado entra aquí.
    """
    filas = list(filas)
    totales = Totales()
    por_especialista: dict[UUID, Totales] = {}
    por_dia: dict[date, Decimal] = {}
    for f in filas:
        totales.sumar(f)
        por_especialista.setdefault(f.especialista_id, Totales()).sumar(f)
        por_dia[f.dia] = por_dia.get(f.dia, CERO) + f.cobrado
    por_metodo = None
    if cobros is not None:
        por_metodo = {m: CERO for m in METODOS}
        for _, metodo, monto in cobros:
            por_metodo[metodo] += monto
    return Panel(
        hay_datos=bool(filas), ventas=ventas, totales=totales,
        descuento_pct=porcentaje(totales.descuentos, totales.bruto),
        por_especialista=por_especialista, por_dia=dict(sorted(por_dia.items())), por_metodo=por_metodo,
    )
