import io

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

from apps.demo.seed import CLAVE_DEMO, SALONES_DEMO
from shared import tenancy


def sembrar():
    call_command("seed_demo", stdout=io.StringIO())


@override_settings(DEBUG=True)
class SeedDemoTests(TestCase):
    def tearDown(self):
        tenancy.limpiar()

    def login(self, email):
        return self.client.post("/api/auth/login", {"email": email, "password": CLAVE_DEMO},
                                content_type="application/json")

    def test_crea_usuarios_que_pueden_iniciar_sesion_con_cada_rol(self):
        sembrar()
        esperados = {"admin@lush.test": "ADMINISTRADORA", "especialista@lush.test": "ESPECIALISTA",
                     "lector@lush.test": "LECTOR"}
        for email, rol in esperados.items():
            with self.subTest(email=email):
                r = self.login(email)
                self.assertEqual(r.status_code, 200, r.content)
                self.assertEqual(r.json()["usuario"]["roles"], [rol])

    def test_es_idempotente(self):
        sembrar()
        sembrar()
        self.assertEqual(self.login("admin@lush.test").status_code, 200)
        cab = {"HTTP_AUTHORIZATION": f"Bearer {self.login('admin@lush.test').json()['token']}"}
        servicios = self.client.get("/api/v1/servicios/", **cab).json()
        self.assertEqual(len(servicios), len({s["nombre"] for s in servicios}))

    def test_hay_catalogo_y_especialista_vinculada_al_usuario(self):
        sembrar()
        cab = {"HTTP_AUTHORIZATION": f"Bearer {self.login('admin@lush.test').json()['token']}"}
        self.assertGreaterEqual(len(self.client.get("/api/v1/servicios/", **cab).json()), 3)
        self.assertGreaterEqual(len(self.client.get("/api/v1/especialistas/", **cab).json()), 2)
        self.assertGreaterEqual(len(self.client.get("/api/v1/clientes/", **cab).json()), 2)

    def test_deja_politicas_de_comision_general_y_propia(self):
        sembrar()
        cab = {"HTTP_AUTHORIZATION": f"Bearer {self.login('admin@lush.test').json()['token']}"}
        reglas = self.client.get("/api/v1/comisiones/reglas/", **cab).json()
        self.assertEqual(sorted(r["base"] for r in reglas), ["PRECIO_COBRADO", "PRECIO_LISTA"])
        ventas = self.client.get("/api/v1/ventas/", **cab).json()
        self.assertTrue(all(l["comision"] is not None for v in ventas for l in v["lineas"]))

    def test_hay_un_segundo_salon_para_probar_aislamiento(self):
        sembrar()
        self.assertGreaterEqual(len(SALONES_DEMO), 2)
        cab = {"HTTP_AUTHORIZATION": f"Bearer {self.login('admin@otro.test').json()['token']}"}
        self.assertEqual(self.client.get("/api/v1/servicios/", **cab).status_code, 200)

    def test_deja_ventas_de_ejemplo(self):
        sembrar()
        cab = {"HTTP_AUTHORIZATION": f"Bearer {self.login('admin@lush.test').json()['token']}"}
        self.assertTrue(self.client.get("/api/v1/ventas/", **cab).json())


class SeedProduccionTests(TestCase):
    @override_settings(DEBUG=False)
    def test_se_niega_fuera_de_desarrollo(self):
        with self.assertRaises(CommandError):
            sembrar()
