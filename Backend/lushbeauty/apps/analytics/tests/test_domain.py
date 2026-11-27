from datetime import date
from decimal import Decimal as D
from uuid import uuid4

from django.test import SimpleTestCase

from apps.analytics.domain import panel as p

D1, D2 = date(2026, 6, 1), date(2026, 6, 2)
PATY, KATHE = uuid4(), uuid4()


def fila(dia, esp, serv, bruto, desc, cobrado, com, prop="0"):
    return p.FilaLineas(dia, esp, serv, D(bruto), D(desc), D(cobrado), D(com), D(prop))


class ConsolidarTests(SimpleTestCase):
    def setUp(self):
        self.filas = [fila(D1, PATY, 2, "300", "30", "270", "105", "10"), fila(D1, KATHE, 1, "120", "0", "120", "42"),
                      fila(D2, PATY, 1, "80", "0", "80", "28")]

    def test_totales_y_porcentaje_de_descuento(self):
        r = p.consolidar(self.filas, ventas=3)
        self.assertTrue(r.hay_datos)
        t = r.totales
        self.assertEqual((t.servicios, t.bruto, t.descuentos, t.cobrado, t.comisiones, t.propinas),
                         (4, D("500"), D("30"), D("470"), D("175"), D("10")))
        self.assertEqual(r.descuento_pct, D("0.0600"))

    def test_los_totales_por_especialista_suman_el_total(self):
        r = p.consolidar(self.filas, ventas=3)
        self.assertEqual(r.por_especialista[PATY].cobrado, D("350"))
        self.assertEqual(sum(x.cobrado for x in r.por_especialista.values()), r.totales.cobrado)

    def test_cobrado_por_dia_ordenado(self):
        r = p.consolidar(self.filas, ventas=3)
        self.assertEqual(list(r.por_dia.items()), [(D1, D("390")), (D2, D("80"))])

    def test_por_metodo_sale_de_los_pagos_y_trae_los_cuatro(self):
        cobros = [(D1, "EFECTIVO", D("320")), (D1, "QR", D("70")), (D2, "EFECTIVO", D("80"))]
        r = p.consolidar(self.filas, ventas=3, cobros=cobros)
        self.assertEqual(r.por_metodo, {"EFECTIVO": D("400"), "QR": D("70"), "TRANSFERENCIA": D("0"), "TARJETA": D("0")})
        self.assertEqual(sum(r.por_metodo.values()), r.totales.cobrado)

    def test_sin_cobros_no_hay_desglose_por_metodo(self):
        self.assertIsNone(p.consolidar(self.filas, ventas=3).por_metodo)

    def test_sin_datos_lo_dice_y_no_inventa_porcentaje(self):
        r = p.consolidar([], ventas=0)
        self.assertFalse(r.hay_datos)
        self.assertIsNone(r.descuento_pct)
        self.assertEqual(r.totales.cobrado, D("0"))

    def test_porcentaje_redondea_mitad_hacia_arriba(self):
        self.assertEqual(p.porcentaje(D("1"), D("3")), D("0.3333"))
        self.assertEqual(p.porcentaje(D("1"), D("16")), D("0.0625"))
        self.assertEqual(p.porcentaje(D("1"), D("32")), D("0.0313"))  # 0.03125 -> 0.0313
