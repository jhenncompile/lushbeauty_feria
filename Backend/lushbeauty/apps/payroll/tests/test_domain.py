from datetime import date
from decimal import Decimal as D

from django.test import SimpleTestCase

from apps.payroll.domain import nomina as n


class PeriodoTests(SimpleTestCase):
    def test_semana_de_lunes_a_domingo_por_defecto(self):
        # 2026-06-03 es miércoles
        self.assertEqual(n.periodo_de(date(2026, 6, 3)), (date(2026, 6, 1), date(2026, 6, 7)))

    def test_los_extremos_pertenecen_a_su_semana(self):
        self.assertEqual(n.periodo_de(date(2026, 6, 1)), (date(2026, 6, 1), date(2026, 6, 7)))  # lunes
        self.assertEqual(n.periodo_de(date(2026, 6, 7)), (date(2026, 6, 1), date(2026, 6, 7)))  # domingo
        self.assertEqual(n.periodo_de(date(2026, 6, 8)), (date(2026, 6, 8), date(2026, 6, 14)))

    def test_corte_en_sabado(self):
        self.assertEqual(n.periodo_de(date(2026, 6, 3), dia_corte=5), (date(2026, 5, 31), date(2026, 6, 6)))
        self.assertEqual(n.periodo_de(date(2026, 6, 6), dia_corte=5), (date(2026, 5, 31), date(2026, 6, 6)))
        self.assertEqual(n.periodo_de(date(2026, 6, 7), dia_corte=5), (date(2026, 6, 7), date(2026, 6, 13)))

    def test_toda_fecha_cae_en_una_semana_de_siete_dias_y_las_semanas_son_contiguas(self):
        for corte in range(7):
            previo = None
            for dia in range(1, 29):
                ini, fin = n.periodo_de(date(2026, 6, dia), corte)
                self.assertEqual((fin - ini).days, 6)
                self.assertTrue(ini <= date(2026, 6, dia) <= fin)
                self.assertEqual(fin.weekday(), corte)
                if previo is not None and (ini, fin) != previo:
                    self.assertEqual((ini - previo[1]).days, 1)  # sin hueco ni solape entre semanas
                previo = (ini, fin)

    def test_dia_de_corte_invalido(self):
        with self.assertRaises(n.ErrorDeNomina):
            n.periodo_de(date(2026, 6, 3), 7)


class CalculoTests(SimpleTestCase):
    def test_suma_sueldo_comision_propina_y_movimientos(self):
        t = n.calcular(D("1500.00"), D("161.00"), D("20.00"), D("-50.00"))
        self.assertEqual((t.neto, t.excedente), (D("1631.00"), D("0.00")))
        self.assertEqual(t.neto - t.excedente, t.sueldo_fijo + t.comision + t.propina + t.movimientos)

    def test_total_negativo_da_neto_cero_y_excedente(self):
        t = n.calcular(D("0.00"), D("100.00"), D("0.00"), D("-250.00"))
        self.assertEqual((t.neto, t.excedente), (D("0.00"), D("150.00")))
        self.assertEqual(t.neto - t.excedente, D("-150.00"))

    def test_total_exactamente_cero(self):
        t = n.calcular(D("0"), D("100"), D("0"), D("-100"))
        self.assertEqual((t.neto, t.excedente), (D("0"), D("0.00")))

    def test_neto_y_excedente_nunca_son_ambos_positivos(self):
        for mov in ("-1000", "-10", "0", "30"):
            t = n.calcular(D("100"), D("20"), D("5"), D(mov))
            self.assertTrue(t.neto == 0 or t.excedente == 0)
            self.assertGreaterEqual(t.neto, 0)


class DeduccionTests(SimpleTestCase):
    def test_valida_y_limpia_el_motivo(self):
        self.assertEqual(n.validar_deduccion("ADELANTO", D("-100.00"), "  Adelanto de quincena "), "Adelanto de quincena")

    def test_rechaza_monto_positivo_cero_o_con_mas_decimales(self):
        for monto in (D("50.00"), D("0"), D("-1.005")):
            with self.subTest(monto=monto), self.assertRaises(n.ErrorDeNomina):
                n.validar_deduccion("FALTA", monto, "x")

    def test_rechaza_motivo_vacio_o_largo_y_tipo_no_permitido(self):
        for motivo in (None, "", "   ", "x" * 251):
            with self.subTest(motivo=motivo), self.assertRaises(n.ErrorDeNomina):
                n.validar_deduccion("FALTA", D("-10"), motivo)
        for tipo in ("AJUSTE", "EXCEDENTE", "OTRO"):
            with self.subTest(tipo=tipo), self.assertRaises(n.ErrorDeNomina):
                n.validar_deduccion(tipo, D("-10"), "x")
