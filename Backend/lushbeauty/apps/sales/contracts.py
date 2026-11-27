"""Interfaz pública de `sales`: lo que `commissions`, `payroll` y `cashier` pueden usar."""

from apps.sales.domain.calculo import METODOS_PAGO, calcular_linea, validar_pagos
from apps.sales.services.anular import anular_venta
from apps.sales.services.consultas import cobros_confirmados, descuentos_confirmados, resumen_de_lineas
from apps.sales.services.registrar import LineaEntrada, PagoEntrada, registrar_venta

__all__ = ["METODOS_PAGO", "calcular_linea", "validar_pagos", "anular_venta",
           "LineaEntrada", "PagoEntrada", "registrar_venta", "cobros_confirmados", "descuentos_confirmados",
           "resumen_de_lineas"]
