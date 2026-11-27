from datetime import date
from decimal import Decimal as D
from uuid import uuid4

from django.test import SimpleTestCase

from apps.commissions.domain import comision as c

LISTA, COBRADO = c.PRECIO_LISTA, c.PRECIO_COBRADO


def regla(porcentaje="0.35", base=LISTA, desde=date(2026, 1, 1), hasta=None, especialista_id=None):
    return c.Regla(uuid4(), especialista_id, D(porcentaje), base, desde, hasta)


class CalculoTests(SimpleTestCase):
    def test_cp02_35_por_ciento_sobre_lista_120_da_42(self):
        r = c.calcular(regla("0.35", LISTA), precio_lista=D("120.00"), cantidad=1, importe_cobrado=D("120.00"))
        self.assertEqual(r.comision, D("42.00"))
        self.assertEqual((r.base, r.tasa, r.regla_id), (LISTA, D("0.35"), r.regla_id))

    def test_base_lista_ignora_el_descuento(self):
        r = c.calcular(regla("0.35", LISTA), precio_lista=D("120.00"), cantidad=1, importe_cobrado=D("100.00"))
        self.assertEqual(r.comision, D("42.00"))

    def test_base_cobrado_usa_el_importe_neto(self):
        r = c.calcular(regla("0.35", COBRADO), precio_lista=D("120.00"), cantidad=1, importe_cobrado=D("100.00"))
        self.assertEqual(r.comision, D("35.00"))

    def test_base_lista_multiplica_por_cantidad(self):
        r = c.calcular(regla("0.10", LISTA), precio_lista=D("80.00"), cantidad=3, importe_cobrado=D("240.00"))
        self.assertEqual(r.comision, D("24.00"))

    def test_redondea_a_centavos_mitad_hacia_arriba(self):
        r = c.calcular(regla("0.3333", LISTA), precio_lista=D("10.01"), cantidad=1, importe_cobrado=D("10.01"))
        self.assertEqual(r.comision, D("3.34"))  # 3.336333 -> 3.34
        r = c.calcular(regla("0.5", LISTA), precio_lista=D("0.01"), cantidad=1, importe_cobrado=D("0.01"))
        self.assertEqual(r.comision, D("0.01"))  # 0.005 -> 0.01

    def test_comision_cero_si_la_tasa_es_cero(self):
        r = c.calcular(regla("0", LISTA), precio_lista=D("120.00"), cantidad=1, importe_cobrado=D("120.00"))
        self.assertEqual(r.comision, D("0.00"))


class SeleccionTests(SimpleTestCase):
    def test_la_regla_especifica_gana_a_la_general(self):
        esp = uuid4()
        general, propia = regla("0.35"), regla("0.40", especialista_id=esp)
        self.assertIs(c.seleccionar([general, propia], esp, date(2026, 6, 1)), propia)

    def test_sin_regla_propia_aplica_la_general(self):
        general = regla("0.35")
        self.assertIs(c.seleccionar([general, regla("0.40", especialista_id=uuid4())], uuid4(), date(2026, 6, 1)), general)

    def test_respeta_la_vigencia_en_ambos_extremos(self):
        vieja = regla("0.30", desde=date(2026, 1, 1), hasta=date(2026, 3, 31))
        nueva = regla("0.35", desde=date(2026, 4, 1))
        for dia, esperada in [(date(2026, 3, 31), vieja), (date(2026, 4, 1), nueva), (date(2026, 1, 1), vieja)]:
            self.assertIs(c.seleccionar([vieja, nueva], uuid4(), dia), esperada)

    def test_sin_regla_vigente_falla(self):
        with self.assertRaises(c.SinReglaVigente):
            c.seleccionar([regla(desde=date(2026, 5, 1))], uuid4(), date(2026, 4, 30))
        with self.assertRaises(c.SinReglaVigente):
            c.seleccionar([], uuid4(), date(2026, 4, 30))

    def test_una_especifica_vencida_cae_a_la_general(self):
        esp = uuid4()
        general = regla("0.35")
        vencida = regla("0.40", especialista_id=esp, hasta=date(2026, 2, 1))
        self.assertIs(c.seleccionar([general, vencida], esp, date(2026, 6, 1)), general)


class NuevaVersionTests(SimpleTestCase):
    HOY = date(2026, 6, 10)

    def planificar(self, existentes, desde=date(2026, 7, 1), porcentaje="0.40", motivo="Ajuste", base=LISTA):
        return c.planificar_version(existentes, porcentaje=D(porcentaje), base=base, desde=desde,
                                    motivo=motivo, hoy=self.HOY)

    def test_primera_version_no_cierra_nada(self):
        self.assertIsNone(self.planificar([]).cerrar_id)

    def test_cierra_la_version_abierta_el_dia_anterior(self):
        abierta = regla(desde=date(2026, 1, 1))
        plan = self.planificar([abierta], desde=date(2026, 7, 1))
        self.assertEqual((plan.cerrar_id, plan.cerrar_hasta), (abierta.id, date(2026, 6, 30)))

    def test_primera_version_puede_tener_inicio_pasado(self):
        self.assertIsNone(self.planificar([], desde=date(2026, 1, 1)).cerrar_id)

    def test_con_historial_no_se_acepta_inicio_pasado(self):
        with self.assertRaises(c.ErrorDeComision):
            self.planificar([regla(desde=date(2026, 1, 1))], desde=date(2026, 6, 9))

    def test_inicio_hoy_es_valido(self):
        plan = self.planificar([regla(desde=date(2026, 1, 1))], desde=self.HOY)
        self.assertEqual(plan.cerrar_hasta, date(2026, 6, 9))

    def test_rechaza_inicio_igual_o_anterior_a_una_version_existente(self):
        with self.assertRaises(c.ErrorDeComision):
            self.planificar([regla(desde=date(2026, 7, 1))], desde=date(2026, 7, 1))
        with self.assertRaises(c.ErrorDeComision):
            self.planificar([regla(desde=date(2026, 8, 1))], desde=date(2026, 7, 1))

    def test_motivo_obligatorio(self):
        for motivo in ("", "   ", None):
            with self.subTest(motivo=motivo), self.assertRaises(c.ErrorDeComision):
                self.planificar([], motivo=motivo)

    def test_porcentaje_fuera_de_rango_o_base_invalida(self):
        for p in ("-0.01", "1.0001"):
            with self.subTest(p=p), self.assertRaises(c.ErrorDeComision):
                self.planificar([], porcentaje=p)
        with self.assertRaises(c.ErrorDeComision):
            self.planificar([], base="OTRA")

    def test_no_cierra_una_version_ya_cerrada(self):
        cerrada = regla(desde=date(2026, 1, 1), hasta=date(2026, 6, 30))
        self.assertIsNone(self.planificar([cerrada], desde=date(2026, 7, 1)).cerrar_id)
