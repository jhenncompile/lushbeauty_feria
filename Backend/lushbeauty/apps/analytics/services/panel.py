"""Panel financiero del salón activo. Lee de `sales` y `catalog` solo por sus contratos; no tiene tablas."""

from __future__ import annotations

from datetime import date, timedelta

from apps.analytics.domain import panel as dominio
from apps.catalog import contracts as catalogo
from apps.sales import contracts as ventas

MAX_DIAS = 366


class PanelRechazado(Exception):
    def __init__(self, codigo: str, mensaje: str, estado: int = 400):
        super().__init__(mensaje)
        self.codigo, self.mensaje, self.estado = codigo, mensaje, estado


def construir(desde: date, hasta: date, *, especialista_id=None) -> tuple[dominio.Panel, dict]:
    """Con `especialista_id` solo cuenta sus líneas y no hay desglose por método (los pagos son de la venta)."""
    if hasta < desde:
        raise PanelRechazado("rango", "La fecha final no puede ser anterior a la inicial.")
    if hasta - desde > timedelta(days=MAX_DIAS):
        raise PanelRechazado("rango_largo", f"El rango no puede pasar de {MAX_DIAS} días.")
    filas, n_ventas = ventas.resumen_de_lineas(desde, hasta, especialista_id)
    cobros = ventas.cobros_confirmados(desde, hasta) if especialista_id is None else None
    panel = dominio.consolidar([dominio.FilaLineas(*f) for f in filas], ventas=n_ventas, cobros=cobros)
    return panel, catalogo.nombres_de_especialistas(panel.por_especialista)
