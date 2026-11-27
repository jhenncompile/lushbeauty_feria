import json
from datetime import timedelta
from decimal import Decimal as D

from django.db import DatabaseError, connection, transaction
from django.utils import timezone

from apps.audit.persistence.models import Auditoria
from apps.cashier.persistence.models import CierreCaja
from apps.sales.tests.base import VentasTestCase
from shared import tenancy

HOY = timezone.localdate()


class CajaTestCase(VentasTestCase):
    def vender(self, auth, pagos, **extra):
        r = self.post(auth, self.cuerpo(pagos=pagos, **extra))
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()

    def cerrar(self, auth, declaraciones, fecha=None):
        return self.client.post("/api/v1/caja/cierres/", content_type="application/json", **auth,
                                data=json.dumps({"fecha": (fecha or HOY).isoformat(), "declaraciones": declaraciones}))

    def datos(self):
        """Hoy: EFECTIVO 80 + 50, QR 70 (una venta de 120 pagada 50 efectivo + 70 QR, otra de 80 en efectivo)."""
        auth = self.login("admin@a.test")
        self.vender(auth, [{"metodo": "EFECTIVO", "monto": "50.00"}, {"metodo": "QR", "monto": "70.00"}])
        corte80 = self.linea(descuento="40.00", motivo_descuento="Promo")
        self.vender(auth, [{"metodo": "EFECTIVO", "monto": "80.00"}], lineas=[corte80])
        return auth


class ResumenTests(CajaTestCase):
    def test_resumen_suma_pagos_por_metodo_y_descuentos(self):
        auth = self.datos()
        r = self.client.get("/api/v1/caja/resumen/", {"desde": HOY.isoformat(), "hasta": HOY.isoformat()}, **auth)
        self.assertEqual(r.status_code, 200, r.content)
        dia = r.json()[0]
        self.assertEqual(dia["por_metodo"], {"EFECTIVO": "130.00", "QR": "70.00", "TRANSFERENCIA": "0.00", "TARJETA": "0.00"})
        self.assertEqual((dia["total"], dia["descuentos"]), ("200.00", "40.00"))

    def test_las_ventas_anuladas_no_cuentan(self):
        auth = self.datos()
        venta = self.vender(auth, [{"metodo": "TARJETA", "monto": "120.00"}])
        self.assertEqual(self.post(auth, {"motivo": "Error"}, ruta=f"/api/v1/ventas/{venta['id']}/anular/").status_code, 200)
        dia = self.client.get("/api/v1/caja/resumen/", {"desde": HOY.isoformat(), "hasta": HOY.isoformat()}, **auth).json()[0]
        self.assertEqual(dia["por_metodo"]["TARJETA"], "0.00")
        self.assertEqual(dia["total"], "200.00")

    def test_respeta_el_rango_de_fechas(self):
        auth = self.datos()
        ayer = (HOY - timedelta(days=1)).isoformat()
        self.assertEqual(self.client.get("/api/v1/caja/resumen/", {"desde": ayer, "hasta": ayer}, **auth).json(), [])

    def test_rango_invertido_o_ausente_da_400(self):
        auth = self.login("admin@a.test")
        self.assertEqual(self.client.get("/api/v1/caja/resumen/", {"desde": "2026-06-02", "hasta": "2026-06-01"}, **auth).status_code, 400)
        self.assertEqual(self.client.get("/api/v1/caja/resumen/", **auth).status_code, 400)

    def test_el_resumen_de_un_salon_no_incluye_ventas_de_otro(self):
        self.datos()
        auth_b = self.login("admin@b.test")
        self.assertEqual(self.client.get("/api/v1/caja/resumen/", {"desde": HOY.isoformat(), "hasta": HOY.isoformat()}, **auth_b).json(), [])


class CierreTests(CajaTestCase):
    def test_registra_esperado_declarado_y_diferencia_por_metodo(self):
        auth = self.datos()
        r = self.cerrar(auth, [{"metodo": "EFECTIVO", "declarado": "120.00", "justificacion": "Se dio cambio de más"},
                               {"metodo": "QR", "declarado": "70.00"}])
        self.assertEqual(r.status_code, 201, r.content)
        efectivo, qr = r.json()
        self.assertEqual((efectivo["esperado"], efectivo["declarado"], efectivo["diferencia"], efectivo["estado"]),
                         ("130.00", "120.00", "-10.00", "FALTA"))
        self.assertEqual((qr["diferencia"], qr["estado"], qr["aprobado"]), ("0.00", "CUADRA", False))

    def test_diferencia_sin_justificacion_se_rechaza_y_no_guarda_nada(self):
        auth = self.datos()
        r = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}, {"metodo": "EFECTIVO", "declarado": "100.00"}])
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "declaracion"))
        with tenancy.en_salon(self.salon_a):
            self.assertFalse(CierreCaja.objects.exists())

    def test_reintentar_actualiza_la_fila_y_no_la_duplica(self):
        auth = self.datos()
        self.cerrar(auth, [{"metodo": "QR", "declarado": "60.00", "justificacion": "Conteo"}])
        r = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}])
        self.assertEqual(r.status_code, 201)
        with tenancy.en_salon(self.salon_a):
            filas = CierreCaja.objects.filter(metodo="QR")
            self.assertEqual((filas.count(), filas.get().declarado), (1, D("70.00")))

    def test_fecha_futura_metodo_repetido_y_vacio(self):
        auth = self.login("admin@a.test")
        manana = HOY + timedelta(days=1)
        self.assertEqual(self.cerrar(auth, [{"metodo": "QR", "declarado": "0"}], fecha=manana).json()["codigo"], "fecha_futura")
        rep = [{"metodo": "QR", "declarado": "0"}, {"metodo": "QR", "declarado": "0"}]
        self.assertEqual(self.cerrar(auth, rep).json()["codigo"], "metodo_repetido")
        self.assertEqual(self.cerrar(auth, []).status_code, 400)

    def test_aprobar_congela_el_cierre(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        r = self.client.post(f"/api/v1/caja/cierres/{cierre['id']}/aprobar/", **auth)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(r.json()["aprobado"])
        self.assertEqual(self.client.post(f"/api/v1/caja/cierres/{cierre['id']}/aprobar/", **auth).status_code, 409)
        reintento = self.cerrar(auth, [{"metodo": "QR", "declarado": "10.00", "justificacion": "x"}])
        self.assertEqual((reintento.status_code, reintento.json()["codigo"]), (409, "ya_aprobado"))
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="APROBAR", entidad="cierre_caja").exists())

    def test_la_base_impide_modificar_o_borrar_un_cierre_aprobado(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.client.post(f"/api/v1/caja/cierres/{cierre['id']}/aprobar/", **auth)
        with tenancy.en_salon(self.salon_a):
            for accion in (lambda: CierreCaja.objects.filter(id=cierre["id"]).update(declarado=D("1")),
                           lambda: CierreCaja.objects.filter(id=cierre["id"]).delete()):
                with self.assertRaises(DatabaseError), transaction.atomic():
                    accion()

    def test_el_historial_lista_los_cierres_del_salon(self):
        auth = self.datos()
        self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}])
        self.assertEqual(len(self.client.get("/api/v1/caja/cierres/", **auth).json()), 1)
        self.assertEqual(self.client.get("/api/v1/caja/cierres/", **self.login("admin@b.test")).json(), [])


class PermisosTests(CajaTestCase):
    def test_especialista_y_lector_reciben_403_y_queda_registrado(self):
        for email in ("esp@a.test", "lector@a.test"):
            auth = self.login(email)
            for metodo, url in [("get", "/api/v1/caja/resumen/"), ("get", "/api/v1/caja/cierres/"),
                                ("post", "/api/v1/caja/cierres/")]:
                with self.subTest(email=email, url=url, metodo=metodo):
                    self.assertEqual(getattr(self.client, metodo)(url, **auth).status_code, 403)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__permiso="CAJA_CERRAR").exists())

    def test_sin_sesion_401(self):
        self.assertEqual(self.client.get("/api/v1/caja/cierres/").status_code, 401)

    def test_un_cierre_de_otro_salon_da_404(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.assertEqual(self.client.post(f"/api/v1/caja/cierres/{cierre['id']}/aprobar/", **self.login("admin@b.test")).status_code, 404)

    def test_aislamiento_por_rls_con_sql_crudo(self):
        auth = self.datos()
        self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}])
        with tenancy.en_salon(self.salon_b), connection.cursor() as c:
            c.execute("SELECT count(*) FROM cierre_caja")
            self.assertEqual(c.fetchone()[0], 0)


class EventoDeCierreTests(CajaTestCase):
    """Decisión 9: un evento `cierre_caja.aprobado` por método aprobado, en la misma transacción."""

    def eventos(self):
        from apps.notifications.persistence.models import EventoOutbox
        with tenancy.en_salon(self.salon_a):
            return list(EventoOutbox.objects.order_by("creado_en"))

    def aprobar(self, auth, cierre):
        return self.client.post(f"/api/v1/caja/cierres/{cierre['id']}/aprobar/", **auth)

    def test_aprobar_deja_un_evento_con_el_id_del_cierre(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.assertEqual(self.eventos(), [])  # registrar no emite
        self.assertEqual(self.aprobar(auth, cierre).status_code, 200)
        (evento,) = self.eventos()
        self.assertEqual((evento.tipo, str(evento.entidad_id), evento.estado), ("cierre_caja.aprobado", cierre["id"], "PENDIENTE"))
        self.assertEqual(evento.payload, {"fecha": HOY.isoformat(), "metodo": "QR", "estado": "CUADRA"})

    def test_cada_metodo_aprobado_emite_su_propio_evento(self):
        auth = self.datos()
        filas = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"},
                                   {"metodo": "EFECTIVO", "declarado": "120.00", "justificacion": "Cambio dado"}]).json()
        for fila in filas:
            self.aprobar(auth, fila)
        eventos = self.eventos()
        self.assertEqual(len(eventos), 2)
        self.assertEqual(sorted(e.payload["estado"] for e in eventos), ["CUADRA", "FALTA"])

    def test_aprobar_dos_veces_no_duplica_el_evento(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.aprobar(auth, cierre)
        self.assertEqual(self.aprobar(auth, cierre).status_code, 409)
        self.assertEqual(len(self.eventos()), 1)

    def test_una_aprobacion_rechazada_no_deja_evento(self):
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.assertEqual(self.aprobar(self.login("esp@a.test"), cierre).status_code, 403)
        self.assertEqual(self.eventos(), [])

    def test_si_falla_el_evento_la_aprobacion_se_deshace(self):
        from unittest import mock
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        with mock.patch("apps.cashier.services.caja.notificaciones.publicar_evento", side_effect=RuntimeError("outbox caído")):
            with self.assertRaises(RuntimeError):
                self.aprobar(auth, cierre)
        with tenancy.en_salon(self.salon_a):
            self.assertIsNone(CierreCaja.objects.get(id=cierre["id"]).aprobado_por)

    def test_el_publicador_entrega_el_evento_de_cierre(self):
        from apps.notifications.services import publicador
        auth = self.datos()
        cierre = self.cerrar(auth, [{"metodo": "QR", "declarado": "70.00"}]).json()[0]
        self.aprobar(auth, cierre)
        recibidos = []
        cuenta = publicador.publicar_pendientes(recibidos.append)
        self.assertEqual(cuenta["enviados"], 1)
        self.assertEqual((recibidos[0].tipo, str(recibidos[0].entidad_id)), ("cierre_caja.aprobado", cierre["id"]))
