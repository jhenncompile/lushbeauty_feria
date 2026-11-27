from django.test import SimpleTestCase

from apps.notifications.domain import outbox as o

ID, ENT = "11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"


class FirmaTests(SimpleTestCase):
    def test_el_cuerpo_es_canonico(self):
        a = o.cuerpo(ID, "x.y", ENT, {"b": 1, "a": 2})
        b = o.cuerpo(ID, "x.y", ENT, {"a": 2, "b": 1})
        self.assertEqual(a, b)
        self.assertNotIn(b" ", a)

    def test_la_firma_se_verifica_y_cambia_si_algo_cambia(self):
        cuerpo = o.cuerpo(ID, "x.y", ENT, {"a": 1})
        firma = o.firmar("secreto", 1000, cuerpo)
        self.assertTrue(firma.startswith("sha256="))
        self.assertTrue(o.firma_valida("secreto", 1000, cuerpo, firma))
        self.assertFalse(o.firma_valida("otro", 1000, cuerpo, firma))
        self.assertFalse(o.firma_valida("secreto", 1001, cuerpo, firma))
        self.assertFalse(o.firma_valida("secreto", 1000, o.cuerpo(ID, "x.y", ENT, {"a": 2}), firma))


class ReintentosTests(SimpleTestCase):
    def test_exito_cierra_el_evento(self):
        self.assertEqual(o.estado_tras_intento(0, True, 3), o.ENVIADO)
        self.assertEqual(o.estado_tras_intento(2, True, 3), o.ENVIADO)

    def test_fallo_reintenta_hasta_agotar_los_intentos(self):
        self.assertEqual(o.estado_tras_intento(0, False, 3), o.PENDIENTE)
        self.assertEqual(o.estado_tras_intento(1, False, 3), o.PENDIENTE)
        self.assertEqual(o.estado_tras_intento(2, False, 3), o.FALLIDO)

    def test_el_error_se_recorta(self):
        self.assertEqual(len(o.recortar_error("x" * 2000)), o.MAX_ERROR)
        self.assertEqual(o.recortar_error("corto"), "corto")
