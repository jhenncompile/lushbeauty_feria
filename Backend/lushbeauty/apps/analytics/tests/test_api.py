from datetime import timedelta

from django.utils import timezone

from apps.audit.persistence.models import Auditoria
from apps.sales.tests.base import VentasTestCase
from shared import tenancy

HOY = timezone.localdate()
URL = "/api/v1/analytics/panel/"
RANGO = {"desde": HOY.isoformat(), "hasta": HOY.isoformat()}


class PanelTestCase(VentasTestCase):
    def vender(self, auth, *, lineas, pagos):
        r = self.post(auth, self.cuerpo(lineas=lineas, pagos=pagos))
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()

    def datos(self):
        """Hoy: venta 1 = Paty corte 120 (QR). Venta 2 = Kathe tinte 300 con 30 de descuento + Paty corte 120,
        pagada 390 (efectivo 200 + tarjeta 190)."""
        admin = self.login("admin@a.test")
        self.vender(admin, lineas=[self.linea()], pagos=[{"metodo": "QR", "monto": "120.00"}])
        self.vender(admin, lineas=[
            self.linea(self.tinte.id, self.kathe.id, descuento="30.00", motivo_descuento="Promo"), self.linea()],
            pagos=[{"metodo": "EFECTIVO", "monto": "200.00"}, {"metodo": "TARJETA", "monto": "190.00"}])
        return admin


class PanelAdministradoraTests(PanelTestCase):
    def test_los_totales_coinciden_con_la_suma_de_pagos_confirmados(self):
        admin = self.datos()
        r = self.client.get(URL, RANGO, **admin)
        self.assertEqual(r.status_code, 200, r.content)
        d = r.json()
        self.assertEqual((d["ventas"], d["servicios"], d["bruto"], d["descuentos"], d["cobrado"]),
                         (2, 3, "540.00", "30.00", "510.00"))
        self.assertEqual(d["descuento_pct"], "0.0556")
        self.assertEqual(d["por_metodo"], {"EFECTIVO": "200.00", "QR": "120.00", "TRANSFERENCIA": "0.00", "TARJETA": "190.00"})
        self.assertEqual(sum(float(x) for x in d["por_metodo"].values()), float(d["cobrado"]))
        self.assertEqual(d["por_dia"], [{"dia": HOY.isoformat(), "cobrado": "510.00"}])

    def test_comisiones_y_desglose_por_especialista(self):
        d = self.client.get(URL, RANGO, **self.datos()).json()
        self.assertEqual(d["comisiones"], "189.00")  # 35 % sobre lista de 120 + 300 + 120 = 540
        self.assertEqual([e["nombre"] for e in d["por_especialista"]], ["Katherine", "Paty"])  # por cobrado, de mayor a menor
        por_nombre = {e["nombre"]: e for e in d["por_especialista"]}
        paty, kathe = por_nombre["Paty"], por_nombre["Katherine"]
        self.assertEqual((paty["nombre"], paty["servicios"], paty["cobrado"], paty["comisiones"]), ("Paty", 2, "240.00", "84.00"))
        self.assertEqual((kathe["nombre"], kathe["cobrado"], kathe["descuentos"]), ("Katherine", "270.00", "30.00"))

    def test_una_venta_anulada_no_cuenta_como_cobrada(self):
        admin = self.datos()
        venta = self.vender(admin, lineas=[self.linea()], pagos=[{"metodo": "EFECTIVO", "monto": "120.00"}])
        self.post(admin, {"motivo": "Error"}, ruta=f"/api/v1/ventas/{venta['id']}/anular/")
        d = self.client.get(URL, RANGO, **admin).json()
        self.assertEqual((d["ventas"], d["cobrado"], d["por_metodo"]["EFECTIVO"]), (2, "510.00", "200.00"))

    def test_filtra_por_especialista(self):
        admin = self.datos()
        d = self.client.get(URL, {**RANGO, "especialista_id": str(self.kathe.id)}, **admin).json()
        self.assertEqual((d["cobrado"], d["ventas"], len(d["por_especialista"])), ("270.00", 1, 1))
        self.assertIsNone(d["por_metodo"])

    def test_sin_datos_lo_dice_en_vez_de_mostrar_ceros_como_reales(self):
        ayer = (HOY - timedelta(days=1)).isoformat()
        d = self.client.get(URL, {"desde": ayer, "hasta": ayer}, **self.datos()).json()
        self.assertFalse(d["hay_datos"])
        self.assertIsNone(d["descuento_pct"])
        self.assertEqual((d["por_dia"], d["por_especialista"]), ([], []))

    def test_rango_invalido(self):
        admin = self.login("admin@a.test")
        self.assertEqual(self.client.get(URL, **admin).status_code, 400)
        r = self.client.get(URL, {"desde": "2026-06-02", "hasta": "2026-06-01"}, **admin)
        self.assertEqual((r.status_code, r.json()["codigo"]), (400, "rango"))
        r = self.client.get(URL, {"desde": "2024-01-01", "hasta": "2026-06-01"}, **admin)
        self.assertEqual(r.json()["codigo"], "rango_largo")

    def test_el_lector_ve_el_panel_del_salon(self):
        self.datos()
        d = self.client.get(URL, RANGO, **self.login("lector@a.test")).json()
        self.assertEqual(d["cobrado"], "510.00")

    def test_un_salon_no_ve_las_ventas_de_otro(self):
        self.datos()
        d = self.client.get(URL, RANGO, **self.login("admin@b.test")).json()
        self.assertFalse(d["hay_datos"])

    def test_sin_sesion_401(self):
        self.assertEqual(self.client.get(URL, RANGO).status_code, 401)


class PanelEspecialistaTests(PanelTestCase):
    def test_la_especialista_ve_solo_lo_suyo_y_sin_desglose_por_metodo(self):
        self.datos()
        d = self.client.get(URL, RANGO, **self.login("esp@a.test")).json()  # esp@a.test es Paty
        self.assertEqual((d["cobrado"], d["servicios"], d["comisiones"]), ("240.00", 2, "84.00"))
        self.assertEqual([e["nombre"] for e in d["por_especialista"]], ["Paty"])
        self.assertIsNone(d["por_metodo"])

    def test_pedir_a_otra_especialista_se_rechaza_y_queda_registrado(self):
        self.datos()
        auth = self.login("esp@a.test")
        r = self.client.get(URL, {**RANGO, "especialista_id": str(self.kathe.id)}, **auth)
        self.assertEqual(r.status_code, 403)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__ruta=URL).exists())

    def test_pedir_a_si_misma_explicitamente_se_permite(self):
        self.datos()
        r = self.client.get(URL, {**RANGO, "especialista_id": str(self.paty.id)}, **self.login("esp@a.test"))
        self.assertEqual((r.status_code, r.json()["cobrado"]), (200, "240.00"))
