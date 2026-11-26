from django.test import TestCase

from apps.identity import contracts
from shared import tenancy

CLAVE = "clave-de-prueba-123"


class DosSalonesTestCase(TestCase):
    """Dos salones sintéticos, cada uno con administradora y especialista."""

    @classmethod
    def setUpTestData(cls):
        cls.salon_a = contracts.crear_salon("Salón A (sintético)")
        cls.salon_b = contracts.crear_salon("Salón B (sintético)")
        cls.admin_a = contracts.crear_usuario(cls.salon_a, nombre="Admin A", email="admin@a.test",
                                              password=CLAVE, roles=[contracts.ADMINISTRADORA])
        cls.esp_a = contracts.crear_usuario(cls.salon_a, nombre="Esp A", email="esp@a.test",
                                            password=CLAVE, roles=[contracts.ESPECIALISTA])
        cls.admin_b = contracts.crear_usuario(cls.salon_b, nombre="Admin B", email="admin@b.test",
                                              password=CLAVE, roles=[contracts.ADMINISTRADORA])

    def tearDown(self):
        tenancy.limpiar()

    def login(self, email):
        r = self.client.post("/api/auth/login", {"email": email, "password": CLAVE}, content_type="application/json")
        self.assertEqual(r.status_code, 200, r.content)
        tenancy.limpiar()
        return {"HTTP_AUTHORIZATION": f"Bearer {r.json()['token']}"}
