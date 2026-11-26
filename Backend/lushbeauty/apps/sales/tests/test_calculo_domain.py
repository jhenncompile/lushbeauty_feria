from decimal import Decimal as D

from django.test import SimpleTestCase

from apps.sales.domain import calculo
from apps.sales.domain.calculo import ErrorDeVenta


class CalculoDeLineaTests(SimpleTestCase):
    def test_cp01_lista_120_descuento_8_cobra_112_y_conserva_la_lista(self):
        linea = calculo.calcular_linea("120.00", 1, "8.00", "Clienta frecuente")
        self.assertEqual(linea.importe_cobrado, D("112.00"))
        self.assertEqual(linea.precio_lista, D("120.00"))
        self.assertEqual(linea.descuento, D("8.00"))

    def test_importe_es_lista_por_cantidad_menos_descuento(self):
        self.assertEqual(calculo.calcular_linea("100.50", 3, "0.50", "promo").importe_cobrado, D("301.00"))

    def test_decimal_exacto_donde_float_falla(self):
        linea = calculo.calcular_linea("0.10", 3)
        self.assertEqual(linea.importe_cobrado, D("0.30"))

    def test_float_no_se_acepta(self):
        with self.assertRaises(TypeError):
            calculo.calcular_linea(120.0, 1)

    def test_rechazos(self):
        casos = {
            "cantidad": dict(precio_lista="120", cantidad=0),
            "descuento_negativo": dict(precio_lista="120", cantidad=1, descuento="-1", motivo_descuento="x"),
            "motivo_descuento": dict(precio_lista="120", cantidad=1, descuento="8"),
            "descuento_excesivo": dict(precio_lista="120", cantidad=1, descuento="121", motivo_descuento="x"),
            "decimales": dict(precio_lista="120.005", cantidad=1),
        }
        for codigo, kwargs in casos.items():
            with self.subTest(codigo), self.assertRaises(ErrorDeVenta) as ctx:
                calculo.calcular_linea(**kwargs)
            self.assertEqual(ctx.exception.codigo, codigo)


class PagosTests(SimpleTestCase):
    def setUp(self):
        self.lineas = [calculo.calcular_linea("120", 1, "8", "x"), calculo.calcular_linea("50", 1)]

    def test_pagos_que_suman_las_lineas_cuadran_incluso_divididos(self):
        total = calculo.validar_pagos(self.lineas, [("EFECTIVO", D("100.00")), ("QR", D("62.00"))])
        self.assertEqual(total, D("162.00"))

    def test_pagos_distintos_de_las_lineas_se_rechazan(self):
        for pagos in ([("EFECTIVO", D("161.99"))], [("EFECTIVO", D("162.01"))]):
            with self.assertRaises(ErrorDeVenta) as ctx:
                calculo.validar_pagos(self.lineas, pagos)
            self.assertEqual(ctx.exception.codigo, "pagos_no_cuadran")

    def test_sin_lineas_sin_pagos_metodo_invalido_o_pago_no_positivo(self):
        for lineas, pagos, codigo in [
            ([], [("EFECTIVO", D("1"))], "sin_lineas"),
            (self.lineas, [], "sin_pagos"),
            (self.lineas, [("BITCOIN", D("162"))], "metodo_pago"),
            (self.lineas, [("EFECTIVO", D("0")), ("QR", D("162"))], "pago_no_positivo"),
        ]:
            with self.subTest(codigo), self.assertRaises(ErrorDeVenta) as ctx:
                calculo.validar_pagos(lineas, pagos)
            self.assertEqual(ctx.exception.codigo, codigo)


class UmbralDeDescuentoTests(SimpleTestCase):
    def test_diez_por_ciento_exacto_no_requiere_aprobacion_y_un_centavo_mas_si(self):
        justo = [calculo.calcular_linea("120.00", 1, "12.00", "x")]
        pasado = [calculo.calcular_linea("120.00", 1, "12.01", "x")]
        self.assertFalse(calculo.descuento_requiere_aprobacion(justo, D("0.10")))
        self.assertTrue(calculo.descuento_requiere_aprobacion(pasado, D("0.10")))

    def test_maximo_del_salon(self):
        linea = [calculo.calcular_linea("100", 1, "51", "x")]
        self.assertTrue(calculo.descuento_excede_maximo(linea, D("0.50")))
        self.assertFalse(calculo.descuento_excede_maximo(linea, D("0.51")))
