from datetime import date
from decimal import Decimal as D

from django.test import SimpleTestCase

from apps.cashier.domain import caja as c


class DiferenciaTests(SimpleTestCase):
    def test_falta_sobra_y_cuadra(self):
        self.assertEqual(c.diferencia(D("402.00"), D("412.00")), D("-10.00"))
        self.assertEqual(c.estado_de(D("-10.00")), c.FALTA)
        self.assertEqual(c.estado_de(D("5.00")), c.SOBRA)
        self.assertEqual(c.estado_de(D("0.00")), c.CUADRA)


class ResumenTests(SimpleTestCase):
    def test_totales_por_metodo_trae_los_cuatro_con_cero(self):
        t = c.totales_por_metodo([("QR", D("60.00")), ("QR", D("10.50"))])
        self.assertEqual(t, {"EFECTIVO": D("0"), "QR": D("70.50"), "TRANSFERENCIA": D("0"), "TARJETA": D("0")})

    def test_metodo_desconocido_se_rechaza(self):
        with self.assertRaises(c.ErrorDeCaja):
            c.totales_por_metodo([("CHEQUE", D("1"))])

    def test_el_resumen_coincide_con_la_suma_de_pagos(self):
        d1, d2 = date(2026, 6, 1), date(2026, 6, 2)
        cobros = [(d1, "EFECTIVO", D("80.00")), (d1, "QR", D("60.00")), (d2, "TARJETA", D("250.00"))]
        r = c.resumir(cobros, [(d1, D("10.00"))])
        self.assertEqual([x.dia for x in r], [d1, d2])
        self.assertEqual(r[0].total, D("140.00"))
        self.assertEqual(r[0].descuentos, D("10.00"))
        self.assertEqual(r[1].descuentos, D("0"))
        self.assertEqual(sum(x.total for x in r), sum(m for _, _, m in cobros))

    def test_un_dia_solo_con_descuentos_tambien_aparece(self):
        r = c.resumir([], [(date(2026, 6, 1), D("5.00"))])
        self.assertEqual((r[0].total, r[0].descuentos), (D("0"), D("5.00")))


class DeclaracionTests(SimpleTestCase):
    def test_sin_diferencia_no_exige_justificacion(self):
        self.assertIsNone(c.validar_declaracion("EFECTIVO", D("100.00"), D("100.00"), None))

    def test_con_diferencia_exige_justificacion(self):
        for texto in (None, "", "   "):
            with self.subTest(texto=texto), self.assertRaises(c.ErrorDeCaja):
                c.validar_declaracion("EFECTIVO", D("90.00"), D("100.00"), texto)
        self.assertEqual(c.validar_declaracion("EFECTIVO", D("90.00"), D("100.00"), " Cambio dado "), "Cambio dado")

    def test_rechaza_negativo_decimales_de_mas_y_metodo_invalido(self):
        for metodo, monto in [("EFECTIVO", D("-1")), ("EFECTIVO", D("1.005")), ("CHEQUE", D("1"))]:
            with self.subTest(metodo=metodo, monto=monto), self.assertRaises(c.ErrorDeCaja):
                c.validar_declaracion(metodo, monto, D("1"), "x")
