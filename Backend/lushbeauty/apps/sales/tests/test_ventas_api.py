import uuid

from apps.audit.persistence.models import Auditoria
from apps.sales.persistence.models import LineaVenta, Pago, Venta
from apps.sales.tests.base import VentasTestCase
from shared import tenancy


def contar(modelo, salon):
    with tenancy.en_salon(salon):
        return modelo.objects.count()


class RegistroDeVentaTests(VentasTestCase):
    def test_cp01_lista_120_descuento_8_cobra_112_y_se_conserva_la_lista(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="8.00", motivo_descuento="Clienta frecuente")],
                             pagos=[{"metodo": "EFECTIVO", "monto": "112.00"}])
        r = self.post(auth, cuerpo)
        self.assertEqual(r.status_code, 201, r.content)
        venta = r.json()
        self.assertEqual(venta["estado"], "CONFIRMADA")
        self.assertEqual(venta["total"], "112.00")
        self.assertEqual(venta["lineas"][0]["precio_lista"], "120.00")
        self.assertEqual(venta["lineas"][0]["descuento"], "8.00")
        self.assertEqual(venta["lineas"][0]["importe_cobrado"], "112.00")

    def test_venta_multilinea_con_pagos_divididos(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(
            lineas=[self.linea(), self.linea(self.tinte.id, self.kathe.id, cantidad=2)],
            pagos=[{"metodo": "EFECTIVO", "monto": "220.00"}, {"metodo": "QR", "monto": "500.00"}],
        )
        r = self.post(auth, cuerpo)
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["total"], "720.00")
        self.assertEqual(len(r.json()["pagos"]), 2)

    def test_pagos_distintos_de_las_lineas_se_rechazan_y_no_dejan_nada(self):
        auth = self.login("admin@a.test")
        r = self.post(auth, self.cuerpo(pagos=[{"metodo": "EFECTIVO", "monto": "119.99"}]))
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["codigo"], "pagos_no_cuadran")
        self.assertEqual(contar(Venta, self.salon_a), 0)

    def test_el_precio_lo_pone_el_servidor(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(precio_lista="1.00", importe_cobrado="1.00")])
        r = self.post(auth, cuerpo)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["lineas"][0]["precio_lista"], "120.00")

    def test_el_costo_de_materiales_se_copia_a_la_linea(self):
        auth = self.login("admin@a.test")
        self.post(auth, self.cuerpo())
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(str(LineaVenta.objects.get().costo_materiales), "15.00")

    def test_servicio_o_especialista_de_otro_salon_se_rechazan(self):
        auth = self.login("admin@a.test")
        r = self.post(auth, self.cuerpo(lineas=[self.linea(servicio=self.corte_b.id)]))
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "servicio_inexistente"))
        r = self.post(auth, self.cuerpo(lineas=[self.linea(especialista=self.esp_b.id)]))
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "especialista_inexistente"))

    def test_lector_no_registra_ventas(self):
        auth = self.login("lector@a.test")
        self.assertEqual(self.post(auth, self.cuerpo()).status_code, 403)

    def test_sin_token_401(self):
        self.assertEqual(self.post({}, self.cuerpo()).status_code, 401)


class IdempotenciaTests(VentasTestCase):
    def test_dos_post_con_el_mismo_uuid_dejan_una_sola_venta(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo()
        primera = self.post(auth, cuerpo)
        segunda = self.post(auth, cuerpo)
        self.assertEqual((primera.status_code, segunda.status_code), (201, 200))
        self.assertEqual(primera.json()["id"], segunda.json()["id"])
        self.assertEqual(contar(Venta, self.salon_a), 1)
        self.assertEqual(contar(Pago, self.salon_a), 1)

    def test_el_mismo_uuid_en_otro_salon_es_otra_venta(self):
        clave = uuid.uuid4()
        a = self.post(self.login("admin@a.test"), self.cuerpo(uuid_cliente=clave))
        b = self.post(self.login("admin@b.test"), {
            "uuid_cliente": str(clave),
            "lineas": [{"servicio_id": str(self.corte_b.id), "especialista_id": str(self.esp_b.id)}],
            "pagos": [{"metodo": "QR", "monto": "90.00"}],
        })
        self.assertEqual((a.status_code, b.status_code), (201, 201))
        self.assertNotEqual(a.json()["id"], b.json()["id"])


class DescuentosTests(VentasTestCase):
    def test_especialista_con_descuento_sobre_el_umbral_necesita_aprobacion(self):
        auth = self.login("esp@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="12.01", motivo_descuento="Amiga")],
                             pagos=[{"metodo": "EFECTIVO", "monto": "107.99"}])
        r = self.post(auth, cuerpo)
        self.assertEqual((r.status_code, r.json()["codigo"]), (403, "requiere_aprobacion"))
        self.assertEqual(contar(Venta, self.salon_a), 0)

    def test_especialista_con_descuento_en_el_umbral_exacto_pasa(self):
        auth = self.login("esp@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="12.00", motivo_descuento="Amiga")],
                             pagos=[{"metodo": "EFECTIVO", "monto": "108.00"}])
        self.assertEqual(self.post(auth, cuerpo).status_code, 201)

    def test_administradora_aprueba_y_queda_en_auditoria(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="30.00", motivo_descuento="Cortesía")],
                             pagos=[{"metodo": "QR", "monto": "90.00"}])
        r = self.post(auth, cuerpo)
        self.assertEqual(r.status_code, 201, r.content)
        with tenancy.en_salon(self.salon_a):
            aprobado = Auditoria.objects.get(accion="APROBAR", entidad="descuento")
        self.assertEqual(str(aprobado.entidad_id), r.json()["id"])
        self.assertEqual(aprobado.usuario_id, self.admin_a)

    def test_sobre_el_maximo_del_salon_se_rechaza_hasta_con_administradora(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="60.01", motivo_descuento="x")],
                             pagos=[{"metodo": "QR", "monto": "59.99"}])
        r = self.post(auth, cuerpo)
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "descuento_sobre_maximo"))

    def test_descuento_sin_motivo_se_rechaza(self):
        auth = self.login("admin@a.test")
        cuerpo = self.cuerpo(lineas=[self.linea(descuento="5.00")], pagos=[{"metodo": "QR", "monto": "115.00"}])
        r = self.post(auth, cuerpo)
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "motivo_descuento"))


class EspecialistaPropiaTests(VentasTestCase):
    def test_especialista_registra_sus_propios_servicios(self):
        self.assertEqual(self.post(self.login("esp@a.test"), self.cuerpo()).status_code, 201)

    def test_especialista_no_registra_servicios_de_otra(self):
        r = self.post(self.login("esp@a.test"), self.cuerpo(lineas=[self.linea(especialista=self.kathe.id)]))
        self.assertEqual((r.status_code, r.json()["codigo"]), (403, "especialista_ajena"))


class AnulacionTests(VentasTestCase):
    def crear(self):
        return self.post(self.login("admin@a.test"), self.cuerpo()).json()["id"]

    def anular(self, venta_id, motivo="Error de cobro", email="admin@a.test"):
        return self.post(self.login(email), {"motivo": motivo}, ruta=f"/api/v1/ventas/{venta_id}/anular/")

    def test_anular_conserva_la_venta_sus_lineas_y_deja_auditoria(self):
        venta_id = self.crear()
        r = self.anular(venta_id)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["estado"], "ANULADA")
        self.assertEqual(r.json()["motivo_anulacion"], "Error de cobro")
        self.assertEqual(len(r.json()["lineas"]), 1)
        with tenancy.en_salon(self.salon_a):
            cambio = Auditoria.objects.get(accion="MODIFICAR", entidad="venta", entidad_id=venta_id)
        self.assertEqual(cambio.valor_anterior["estado"], "CONFIRMADA")
        self.assertEqual(cambio.valor_nuevo["estado"], "ANULADA")

    def test_sin_motivo_doble_anulacion_y_permisos(self):
        venta_id = self.crear()
        self.assertEqual(self.anular(venta_id, motivo="  ").status_code, 400)
        self.assertEqual(self.anular(venta_id, email="esp@a.test").status_code, 403)
        self.assertEqual(self.anular(venta_id).status_code, 200)
        self.assertEqual(self.anular(venta_id).status_code, 409)

    def test_una_venta_ya_liquidada_no_se_anula(self):
        venta_id = self.crear()
        with tenancy.en_salon(self.salon_a):
            LineaVenta.objects.filter(venta_id=venta_id).update(liquidacion_id=uuid.uuid4())
        r = self.anular(venta_id)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "venta_liquidada"))

    def test_anular_venta_de_otro_salon_da_404(self):
        venta_id = self.crear()
        r = self.anular(venta_id, email="admin@b.test")
        self.assertEqual(r.status_code, 404)


class AislamientoDeVentasTests(VentasTestCase):
    def test_salon_b_no_ve_ventas_de_a(self):
        venta_id = self.post(self.login("admin@a.test"), self.cuerpo()).json()["id"]
        auth_b = self.login("admin@b.test")
        self.assertEqual(self.client.get("/api/v1/ventas/", **auth_b).json(), [])
        self.assertEqual(self.client.get(f"/api/v1/ventas/{venta_id}/", **auth_b).status_code, 404)

    def test_filtro_por_estado(self):
        auth = self.login("admin@a.test")
        a = self.post(auth, self.cuerpo()).json()["id"]
        self.post(auth, self.cuerpo())
        self.post(auth, {"motivo": "x"}, ruta=f"/api/v1/ventas/{a}/anular/")
        anuladas = self.client.get("/api/v1/ventas/?estado=ANULADA", **auth).json()
        self.assertEqual([v["id"] for v in anuladas], [a])
