"""F03-T3: aprobar congela la liquidación (RN-05), marcar pagada, evento E2 y ajuste por venta anulada."""

from datetime import timedelta
from decimal import Decimal as D
from unittest import mock

from django.db import DatabaseError, transaction

from apps.audit.persistence.models import Auditoria
from apps.notifications.persistence.models import EventoOutbox
from apps.notifications.services import publicador
from apps.payroll.persistence.models import Liquidacion, MovimientoNomina
from apps.payroll.tests.test_api_bd import FIN, GEN, INI, LIST, NominaTestCase
from apps.sales.persistence.models import LineaVenta
from shared import tenancy

SIGUIENTE = FIN + timedelta(days=1)


class AprobarTestCase(NominaTestCase):
    def aprobar(self, auth, liquidacion_id):
        return self.client.post(f"{LIST}{liquidacion_id}/aprobar/", **auth)

    def borrador(self, auth, **kw):
        return self.generar(auth, **kw).json()


class AprobarTests(AprobarTestCase):
    def test_aprobar_congela_totales_lineas_y_movimientos(self):
        admin = self.login("admin@a.test")
        venta = self.vender(admin, propina="10.00")
        self.deducir(admin, monto="-30.00", tipo="MATERIAL", motivo="Tinte")
        borrador = self.borrador(admin)
        r = self.aprobar(admin, borrador["id"])
        self.assertEqual(r.status_code, 200, r.content)
        d = r.json()
        self.assertEqual((d["estado"], d["neto"]), ("APROBADA", "1522.00"))  # 1500 + 42 + 10 − 30
        self.assertIsNotNone(d["aprobada_en"])
        self.assertEqual([l["venta_id"] for l in d["lineas"]], [venta["id"]])
        self.assertEqual(len(d["movimientos"]), 1)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(LineaVenta.objects.get(venta_id=venta["id"]).liquidacion_id.hex, d["id"].replace("-", ""))
            self.assertEqual(MovimientoNomina.objects.get().liquidacion_id.hex, d["id"].replace("-", ""))

    def test_aprobar_recalcula_con_lo_ultimo_aunque_el_borrador_sea_viejo(self):
        admin = self.login("admin@a.test")
        borrador = self.borrador(admin)
        self.vender(admin)  # después de generar el borrador
        d = self.aprobar(admin, borrador["id"]).json()
        self.assertEqual((d["total_comision"], len(d["lineas"])), ("42.00", 1))

    def test_el_detalle_de_una_aprobada_sale_de_lo_que_quedo_ligado(self):
        admin = self.login("admin@a.test")
        self.vender(admin)
        lid = self.borrador(admin)["id"]
        aprobada = self.aprobar(admin, lid).json()
        leido = self.client.get(f"{LIST}{lid}/", **admin).json()
        self.assertEqual((leido["estado"], leido["neto"], len(leido["lineas"])), ("APROBADA", aprobada["neto"], 1))
        nueva = self.vender(admin)  # una venta posterior no entra a la ya aprobada
        self.assertEqual(len(self.client.get(f"{LIST}{lid}/", **admin).json()["lineas"]), 1)
        self.assertIsNotNone(nueva)

    def test_aprobar_dos_veces_da_409(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        r = self.aprobar(admin, lid)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "ya_aprobada"))

    def test_permisos_404_y_aislamiento(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.assertEqual(self.aprobar(self.login("esp@a.test"), lid).status_code, 403)
        self.assertEqual(self.aprobar(admin, "00000000-0000-0000-0000-000000000001").status_code, 404)
        self.assertEqual(self.aprobar(self.login("admin@b.test"), lid).status_code, 404)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(Liquidacion.objects.get(id=lid).estado, "BORRADOR")

    def test_deja_auditoria_y_un_evento_sin_importes(self):
        admin = self.login("admin@a.test")
        self.vender(admin)
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="APROBAR", entidad="liquidacion", entidad_id=lid).exists())
            (evento,) = EventoOutbox.objects.filter(tipo="liquidacion.aprobada")
        self.assertEqual(str(evento.entidad_id), lid)
        self.assertEqual(set(evento.payload), {"periodo_inicio", "periodo_fin"})  # sin importes ni especialista

    def test_si_falla_el_evento_la_aprobacion_se_deshace_completa(self):
        admin = self.login("admin@a.test")
        venta = self.vender(admin)
        lid = self.borrador(admin)["id"]
        with mock.patch("apps.payroll.services.nomina.notificaciones.publicar_evento", side_effect=RuntimeError("outbox caído")):
            with self.assertRaises(RuntimeError):
                self.aprobar(admin, lid)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(Liquidacion.objects.get(id=lid).estado, "BORRADOR")
            self.assertIsNone(LineaVenta.objects.get(venta_id=venta["id"]).liquidacion_id)

    def test_el_publicador_entrega_el_evento(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        recibidos = []
        publicador.publicar_pendientes(recibidos.append)
        self.assertEqual([(e.tipo, str(e.entidad_id)) for e in recibidos], [("liquidacion.aprobada", lid)])

    def test_aprobada_no_admite_deducciones_ni_recalculo_ni_cambios_en_la_base(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        self.assertEqual(self.deducir(admin).status_code, 409)
        self.assertEqual(self.generar(admin).status_code, 409)
        with tenancy.en_salon(self.salon_a):
            with self.assertRaises(DatabaseError), transaction.atomic():
                Liquidacion.objects.filter(id=lid).update(neto=D("1"))

    def test_las_lineas_aprobadas_no_pasan_a_otra_liquidacion(self):
        admin = self.login("admin@a.test")
        self.vender(admin)
        self.aprobar(admin, self.borrador(admin)["id"])
        siguiente = self.borrador(admin, fecha=SIGUIENTE)
        self.assertEqual(siguiente["lineas"], [])


class PagarTests(AprobarTestCase):
    def pagar(self, auth, lid, **cuerpo):
        return self.enviar(f"{LIST}{lid}/pagar/", auth, cuerpo)

    def test_aprobada_pasa_a_pagada_con_comprobante(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        r = self.pagar(admin, lid, comprobante_url="https://ejemplo.test/comprobante.pdf")
        self.assertEqual((r.status_code, r.json()["estado"], r.json()["comprobante_url"]),
                         (200, "PAGADA", "https://ejemplo.test/comprobante.pdf"))
        self.assertEqual(self.pagar(admin, lid).status_code, 409)  # ya pagada

    def test_un_borrador_no_se_marca_pagado(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        r = self.pagar(admin, lid)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "estado"))

    def test_solo_quien_aprueba_la_marca_pagada(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        self.assertEqual(self.pagar(self.login("esp@a.test"), lid).status_code, 403)
        self.assertEqual(self.pagar(self.login("admin@b.test"), lid).status_code, 404)

    def test_url_invalida_da_400(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        self.assertEqual(self.pagar(admin, lid, comprobante_url="no-es-url").status_code, 400)

    def test_una_pagada_sigue_inmutable(self):
        admin = self.login("admin@a.test")
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        self.pagar(admin, lid)
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            Liquidacion.objects.filter(id=lid).update(neto=D("1"))


class VentaAnuladaTrasLiquidarseTests(AprobarTestCase):
    def anular(self, auth, venta_id, motivo="Clienta devolvió el servicio"):
        return self.post(auth, {"motivo": motivo}, ruta=f"/api/v1/ventas/{venta_id}/anular/")

    def liquidar_con_venta(self, admin, propina="0.00"):
        venta = self.vender(admin, propina=propina)
        lid = self.borrador(admin)["id"]
        self.aprobar(admin, lid)
        return venta, lid

    def test_se_puede_anular_una_venta_ya_liquidada(self):
        admin = self.login("admin@a.test")
        venta, _ = self.liquidar_con_venta(admin)
        self.assertEqual(self.anular(admin, venta["id"]).status_code, 200)

    def test_la_liquidacion_aprobada_no_cambia_y_la_siguiente_descuenta_el_ajuste(self):
        admin = self.login("admin@a.test")
        venta, lid = self.liquidar_con_venta(admin, propina="10.00")
        antes = self.client.get(f"{LIST}{lid}/", **admin).json()
        self.anular(admin, venta["id"])
        self.assertEqual(self.client.get(f"{LIST}{lid}/", **admin).json()["neto"], antes["neto"])  # intacta
        sig = self.borrador(admin, fecha=SIGUIENTE)
        self.assertEqual(sig["total_movimientos"], "-52.00")  # −(comisión 42 + propina 10)
        (ajuste,) = sig["movimientos"]
        self.assertEqual((ajuste["tipo"], ajuste["fecha"]), ("AJUSTE", SIGUIENTE.isoformat()))
        self.assertIn("Clienta devolvió el servicio", ajuste["motivo"])
        self.assertEqual(sig["neto"], "1448.00")  # 1500 − 52

    def test_el_ajuste_no_se_duplica_al_regenerar_ni_pasa_dos_veces(self):
        admin = self.login("admin@a.test")
        venta, _ = self.liquidar_con_venta(admin)
        self.anular(admin, venta["id"])
        self.borrador(admin, fecha=SIGUIENTE)
        self.assertEqual(len(self.borrador(admin, fecha=SIGUIENTE)["movimientos"]), 1)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(MovimientoNomina.objects.filter(tipo="AJUSTE").count(), 1)

    def test_aprobar_la_siguiente_congela_el_ajuste_y_no_vuelve_a_aparecer(self):
        admin = self.login("admin@a.test")
        venta, _ = self.liquidar_con_venta(admin)
        self.anular(admin, venta["id"])
        sig = self.borrador(admin, fecha=SIGUIENTE)
        aprobada = self.aprobar(admin, sig["id"]).json()
        self.assertEqual((aprobada["estado"], len(aprobada["movimientos"])), ("APROBADA", 1))
        despues = self.borrador(admin, fecha=SIGUIENTE + timedelta(days=7))
        self.assertEqual(despues["movimientos"], [])

    def test_anular_una_venta_no_liquidada_no_genera_ajuste(self):
        admin = self.login("admin@a.test")
        venta = self.vender(admin)
        self.anular(admin, venta["id"])
        self.assertEqual(self.borrador(admin, fecha=SIGUIENTE)["movimientos"], [])
        self.assertEqual(self.borrador(admin)["lineas"], [])

    def test_un_ajuste_con_importe_cero_no_crea_movimiento(self):
        # línea liquidada sin comisión (anterior a F02) y sin propina: no hay nada que descontar
        import uuid
        from apps.sales.persistence.models import Venta
        from django.utils import timezone
        admin = self.login("admin@a.test")
        with tenancy.en_salon(self.salon_a, self.admin_a):
            v = Venta.objects.create(salon_id=self.salon_a, registrado_por=self.admin_a, uuid_cliente=uuid.uuid4(),
                                     fecha_servicio=timezone.now(), estado=Venta.Estado.CONFIRMADA)
            LineaVenta.objects.create(salon_id=self.salon_a, venta=v, servicio_id=self.corte.id,
                                      especialista_id=self.paty.id, precio_lista=D("120"), importe_cobrado=D("120"))
        self.aprobar(admin, self.borrador(admin)["id"])
        self.anular(admin, str(v.id))
        self.assertEqual(self.borrador(admin, fecha=SIGUIENTE)["movimientos"], [])
