from apps.audit.persistence.models import Auditoria
from apps.identity.tests.base import DosSalonesTestCase
from shared import tenancy

URL = "/api/identity/historial"


class HistorialPorUsuarioTests(DosSalonesTestCase):
    def test_administradora_ve_el_historial_con_el_nombre_del_actor(self):
        cab = self.login("admin@a.test")
        r = self.client.get(URL, **cab)
        self.assertEqual(r.status_code, 200)
        entradas = r.json()
        self.assertTrue(entradas)
        self.assertTrue({"ocurrido_en", "usuario", "accion", "entidad"} <= set(entradas[0]))
        self.assertTrue(any(e["usuario"] == "Admin A" and e["accion"] == "INICIAR_SESION" for e in entradas))

    def test_filtra_por_usuario(self):
        self.login("esp@a.test")
        cab = self.login("admin@a.test")
        r = self.client.get(URL, {"usuario_id": str(self.esp_a)}, **cab)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json())
        self.assertTrue(all(e["usuario_id"] == str(self.esp_a) for e in r.json()))

    def test_acciones_sin_usuario_se_muestran_como_sistema(self):
        cab = self.login("admin@a.test")
        entradas = self.client.get(URL, **cab).json()
        self.assertTrue(any(e["usuario"] == "Sistema" for e in entradas))

    def test_especialista_recibe_403_y_queda_registrado(self):
        cab = self.login("esp@a.test")
        self.assertEqual(self.client.get(URL, **cab).status_code, 403)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(
                accion="ACCESO_DENEGADO", valor_nuevo__permiso="AUDITORIA_VER").exists())

    def test_sin_sesion_recibe_401(self):
        self.assertEqual(self.client.get(URL).status_code, 401)

    def test_no_muestra_el_historial_de_otro_salon(self):
        cab = self.login("admin@b.test")
        entradas = self.client.get(URL, **cab).json()
        self.assertFalse(any(e["usuario"] in ("Admin A", "Esp A") for e in entradas))

    def test_limite_acota_la_respuesta(self):
        cab = self.login("admin@a.test")
        self.assertLessEqual(len(self.client.get(URL, {"limite": 1}, **cab).json()), 1)

    def test_parametros_invalidos_dan_400(self):
        cab = self.login("admin@a.test")
        self.assertEqual(self.client.get(URL, {"usuario_id": "no-es-uuid"}, **cab).status_code, 400)
        self.assertEqual(self.client.get(URL, {"limite": "x"}, **cab).status_code, 400)
