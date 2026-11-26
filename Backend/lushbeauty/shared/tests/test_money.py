from decimal import Decimal

from django.test import SimpleTestCase

from shared import money


class DineroTests(SimpleTestCase):
    def test_float_se_rechaza(self):
        with self.assertRaises(TypeError):
            money.a_decimal(0.1)

    def test_str_e_int_se_convierten_exactos(self):
        self.assertEqual(money.a_decimal("0.10") + money.a_decimal("0.20"), Decimal("0.30"))
        self.assertEqual(money.a_decimal(5), Decimal("5"))

    def test_redondeo_mitad_hacia_arriba(self):
        self.assertEqual(money.redondear(Decimal("0.125")), Decimal("0.13"))
        self.assertEqual(money.redondear(Decimal("0.124")), Decimal("0.12"))
        self.assertEqual(money.redondear(Decimal("2.675")), Decimal("2.68"))  # con float daría 2.67

    def test_centavos(self):
        self.assertTrue(money.tiene_a_lo_sumo_centavos(Decimal("8.50")))
        self.assertFalse(money.tiene_a_lo_sumo_centavos(Decimal("8.505")))
