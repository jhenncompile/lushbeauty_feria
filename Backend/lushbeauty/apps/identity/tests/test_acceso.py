from apps.audit.persistence.models import Auditoria
from apps.identity.tests.base import CLAVE, DosSalonesTestCase
from shared import tenancy


class LoginTests(DosSalonesTestCase):
    def test_login_correcto_devuelve_token_roles_y_permisos(self):
        r = self.client.post("/api/auth/login", {"email": "admin@a.test", "password": CLAVE},
                             content_type="application/json")
        self.assertEqual(r.status_code, 200)
        cuerpo = r.json()
        self.assertIn("token", cuerpo)
        self.assertEqual(cuerpo["usuario"]["roles"], ["ADMINISTRADORA"])
        self.assertIn("ADMIN_USUARIOS", cuerpo["usuario"]["permisos"])

    def test_clave_incorrecta_y_correo_inexistente_dan_401_igual(self):
        for email, clave in [("admin@a.test", "mala"), ("nadie@a.test", CLAVE)]:
            r = self.client.post("/api/auth/login", {"email": email, "password": clave},
                                 content_type="application/json")
            self.assertEqual(r.status_code, 401)
            self.assertEqual(r.json(), {"detail": "Credenciales incorrectas."})

    def test_sin_token_o_token_falso_da_401(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        r = self.client.get("/api/auth/me", HTTP_AUTHORIZATION="Bearer basura")
        self.assertEqual(r.status_code, 401)

    def test_login_deja_entrada_de_auditoria(self):
        self.client.post("/api/auth/login", {"email": "admin@a.test", "password": CLAVE},
                         content_type="application/json")
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="INICIAR_SESION").exists())


class PermisosPorRolTests(DosSalonesTestCase):
    def test_especialista_no_accede_a_administracion_y_el_intento_queda_registrado(self):
        auth = self.login("esp@a.test")
        r = self.client.get("/api/identity/usuarios", **auth)
        self.assertEqual(r.status_code, 403)
        with tenancy.en_salon(self.salon_a):
            denegado = Auditoria.objects.get(accion="ACCESO_DENEGADO")
        self.assertEqual(denegado.usuario_id, self.esp_a)
        self.assertEqual(denegado.valor_nuevo["permiso"], "ADMIN_USUARIOS")

    def test_administradora_lista_solo_usuarios_de_su_salon(self):
        auth = self.login("admin@a.test")
        r = self.client.get("/api/identity/usuarios", **auth)
        self.assertEqual(r.status_code, 200)
        self.assertEqual({u["email"] for u in r.json()}, {"admin@a.test", "esp@a.test"})

    def test_me_devuelve_el_perfil_propio(self):
        auth = self.login("esp@a.test")
        r = self.client.get("/api/auth/me", **auth)
        self.assertEqual(r.json()["roles"], ["ESPECIALISTA"])
