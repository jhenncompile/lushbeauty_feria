import json
from decimal import Decimal

from apps.audit.persistence.models import Auditoria
from apps.catalog.domain.validacion import ErrorDeCatalogo, validar_monto_no_negativo
from apps.sales.tests.base import VentasTestCase
from django.test import SimpleTestCase
from shared import tenancy


class ValidacionDominioTests(SimpleTestCase):
    def test_monto(self):
        self.assertEqual(str(validar_monto_no_negativo("10.50", "x")), "10.50")
        for malo in ("-1", "1.005"):
            with self.assertRaises(ErrorDeCatalogo):
                validar_monto_no_negativo(malo, "x")


class CatalogoApiTests(VentasTestCase):
    def post(self, auth, ruta, cuerpo):
        return self.client.post(ruta, data=json.dumps(cuerpo), content_type="application/json", **auth)

    def test_especialista_no_crea_servicios(self):
        r = self.post(self.login("esp@a.test"), "/api/v1/servicios/",
                      {"categoria": "Uñas", "nombre": "Gel", "precio_lista": "80.00"})
        self.assertEqual(r.status_code, 403)

    def test_administradora_crea_servicio_y_queda_auditado(self):
        r = self.post(self.login("admin@a.test"), "/api/v1/servicios/",
                      {"categoria": "Uñas", "nombre": "Gel", "precio_lista": "80.00", "costo_materiales": "10.00"})
        self.assertEqual(r.status_code, 201, r.content)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="CREAR", entidad="servicio",
                                                     entidad_id=r.json()["id"]).exists())

    def test_precio_negativo_o_con_tres_decimales_se_rechaza(self):
        auth = self.login("admin@a.test")
        for precio in ("-5.00", "80.005"):
            r = self.post(auth, "/api/v1/servicios/", {"categoria": "Uñas", "nombre": f"G{precio}", "precio_lista": precio})
            self.assertIn(r.status_code, (400, 422), precio)

    def test_nombre_duplicado_da_409(self):
        auth = self.login("admin@a.test")
        r = self.post(auth, "/api/v1/servicios/", {"categoria": "Cabello", "nombre": "Corte", "precio_lista": "50"})
        self.assertEqual(r.status_code, 409)

    def test_cambio_de_precio_se_audita_con_antes_y_despues(self):
        auth = self.login("admin@a.test")
        r = self.client.patch(f"/api/v1/servicios/{self.corte.id}/", data=json.dumps({"precio_lista": "130.00"}),
                              content_type="application/json", **auth)
        self.assertEqual(r.status_code, 200)
        with tenancy.en_salon(self.salon_a):
            cambio = Auditoria.objects.get(accion="MODIFICAR", entidad="servicio", entidad_id=self.corte.id)
        # jsonb guarda el número exacto; Python lo lee como float, así que se compara como Decimal.
        self.assertEqual(
            (Decimal(str(cambio.valor_anterior["precio_lista"])), Decimal(str(cambio.valor_nuevo["precio_lista"]))),
            (Decimal("120.00"), Decimal("130.00")),
        )

    def test_datos_sensibles_solo_para_quien_gestiona(self):
        esp = self.login("esp@a.test")
        servicios = self.client.get("/api/v1/servicios/", **esp).json()
        especialistas = self.client.get("/api/v1/especialistas/", **esp).json()
        self.assertTrue(all("costo_materiales" not in s for s in servicios))
        self.assertTrue(all("sueldo_fijo" not in e for e in especialistas))
        admin = self.login("admin@a.test")
        self.assertIn("costo_materiales", self.client.get("/api/v1/servicios/", **admin).json()[0])
        self.assertIn("sueldo_fijo", self.client.get("/api/v1/especialistas/", **admin).json()[0])

    def test_cada_salon_ve_solo_su_catalogo(self):
        nombres_b = {s["nombre"] for s in self.client.get("/api/v1/servicios/", **self.login("admin@b.test")).json()}
        self.assertEqual(nombres_b, {"Corte"})
        precios_b = {s["precio_lista"] for s in self.client.get("/api/v1/servicios/", **self.login("admin@b.test")).json()}
        self.assertEqual(precios_b, {"90.00"})

    def test_clientes(self):
        auth = self.login("esp@a.test")
        r = self.post(auth, "/api/v1/clientes/", {"nombre": "Clienta Sintética"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(self.client.get("/api/v1/clientes/", **auth).json()), 1)
        self.assertEqual(len(self.client.get("/api/v1/clientes/", **self.login("admin@b.test")).json()), 0)
