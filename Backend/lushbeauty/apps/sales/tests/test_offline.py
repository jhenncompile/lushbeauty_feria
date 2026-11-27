"""F05-T1 / CP-03: una venta registrada sin conexión llega con su origen y su clave, y reintentar no la duplica."""

import uuid
from datetime import timedelta

from django.utils import timezone

from apps.sales.persistence.models import Pago, Venta
from apps.sales.tests.base import VentasTestCase
from apps.sales.tests.test_ventas_api import contar


class OrigenDeLaVentaTests(VentasTestCase):
    def test_sin_origen_la_venta_es_web(self):
        r = self.post(self.login("admin@a.test"), self.cuerpo())
        self.assertEqual(r.json()["origen"], "WEB")

    def test_acepta_origen_pwa_offline(self):
        r = self.post(self.login("esp@a.test"), {**self.cuerpo(), "origen": "PWA_OFFLINE"})
        self.assertEqual((r.status_code, r.json()["origen"], r.json()["estado"]), (201, "PWA_OFFLINE", "CONFIRMADA"))

    def test_el_origen_importacion_no_se_acepta_por_el_api(self):
        r = self.post(self.login("admin@a.test"), {**self.cuerpo(), "origen": "IMPORTACION"})
        self.assertEqual(r.status_code, 400)
        r = self.post(self.login("admin@a.test"), {**self.cuerpo(), "origen": "OTRO"})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(contar(Venta, self.salon_a), 0)


class Cp03ReintentoOfflineTests(VentasTestCase):
    def test_cp03_el_mismo_uuid_dos_veces_deja_una_sola_venta_confirmada(self):
        auth = self.login("esp@a.test")
        cuerpo = {**self.cuerpo(), "origen": "PWA_OFFLINE"}
        primera, segunda = self.post(auth, cuerpo), self.post(auth, cuerpo)
        self.assertEqual((primera.status_code, segunda.status_code), (201, 200))
        self.assertEqual(primera.json(), segunda.json())  # el resultado original, idéntico
        self.assertEqual((contar(Venta, self.salon_a), contar(Pago, self.salon_a)), (1, 1))

    def test_el_reintento_devuelve_la_venta_original_aunque_cambie_el_cuerpo(self):
        auth = self.login("esp@a.test")
        clave = uuid.uuid4()
        original = self.post(auth, {**self.cuerpo(uuid_cliente=clave), "origen": "PWA_OFFLINE"}).json()
        distinto = self.cuerpo(uuid_cliente=clave, pagos=[{"metodo": "QR", "monto": "120.00"}])
        reintento = self.post(auth, {**distinto, "origen": "WEB"})
        self.assertEqual(reintento.status_code, 200)
        self.assertEqual((reintento.json()["id"], reintento.json()["origen"]), (original["id"], "PWA_OFFLINE"))
        self.assertEqual(reintento.json()["pagos"], original["pagos"])

    def test_una_venta_de_ayer_sincronizada_hoy_conserva_su_fecha_y_la_regla_de_ese_dia(self):
        ayer = (timezone.now() - timedelta(days=1)).replace(microsecond=0)
        r = self.post(self.login("esp@a.test"), {**self.cuerpo(), "origen": "PWA_OFFLINE", "fecha_servicio": ayer.isoformat()})
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["fecha_servicio"], ayer.isoformat())
        self.assertEqual(r.json()["lineas"][0]["comision"], "42.00")

    def test_una_venta_offline_pasa_las_mismas_validaciones_que_una_web(self):
        auth = self.login("esp@a.test")
        ajena = self.cuerpo(lineas=[self.linea(especialista=self.kathe.id)])
        r = self.post(auth, {**ajena, "origen": "PWA_OFFLINE"})
        self.assertEqual((r.status_code, r.json()["codigo"]), (403, "especialista_ajena"))
        sobre_maximo = self.cuerpo(lineas=[self.linea(descuento="80.00", motivo_descuento="x")],
                                   pagos=[{"metodo": "EFECTIVO", "monto": "40.00"}])
        r = self.post(auth, {**sobre_maximo, "origen": "PWA_OFFLINE"})
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "descuento_sobre_maximo"))
        self.assertEqual(contar(Venta, self.salon_a), 0)

    def test_el_origen_aparece_al_listar(self):
        auth = self.login("esp@a.test")
        self.post(auth, {**self.cuerpo(), "origen": "PWA_OFFLINE"})
        self.assertEqual([v["origen"] for v in self.client.get("/api/v1/ventas/", **auth).json()], ["PWA_OFFLINE"])
