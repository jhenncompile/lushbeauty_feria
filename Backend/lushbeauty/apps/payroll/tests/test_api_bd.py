import json
from datetime import date, timedelta
from decimal import Decimal as D

from django.db import DatabaseError, connection, transaction
from django.utils import timezone

from apps.audit.persistence.models import Auditoria
from apps.identity.persistence.models import Salon
from apps.payroll.domain.nomina import periodo_de
from apps.payroll.persistence.models import Liquidacion, MovimientoNomina
from apps.sales.tests.base import VentasTestCase
from shared import tenancy

HOY = timezone.localdate()
INI, FIN = periodo_de(HOY)
DED = "/api/v1/nomina/deducciones/"
GEN = "/api/v1/nomina/liquidaciones/generar/"
LIST = "/api/v1/nomina/liquidaciones/"


class NominaTestCase(VentasTestCase):
    def enviar(self, url, auth, cuerpo):
        return self.client.post(url, data=json.dumps(cuerpo), content_type="application/json", **auth)

    def deducir(self, auth, **extra):
        cuerpo = {"especialista_id": str(self.paty.id), "tipo": "ADELANTO", "monto": "-100.00",
                  "motivo": "Adelanto de quincena", "fecha": INI.isoformat(), **extra}
        return self.enviar(DED, auth, cuerpo)

    def generar(self, auth, especialista=None, fecha=None):
        return self.enviar(GEN, auth, {"especialista_id": str(especialista or self.paty.id), "fecha": (fecha or HOY).isoformat()})

    def vender(self, auth, especialista=None, propina="0.00"):
        extra = {"propina": propina, "metodo_propina": "EFECTIVO"} if propina != "0.00" else {}
        linea = self.linea(especialista=especialista or self.paty.id, **extra)
        r = self.post(auth, self.cuerpo(lineas=[linea], pagos=[{"metodo": "EFECTIVO", "monto": "120.00"}]))
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()


class DeduccionesTests(NominaTestCase):
    def test_registra_una_deduccion_con_motivo(self):
        r = self.deducir(self.login("admin@a.test"))
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual((r.json()["monto"], r.json()["tipo"], r.json()["motivo"]), ("-100.00", "ADELANTO", "Adelanto de quincena"))

    def test_rechaza_sin_motivo_con_monto_positivo_y_tipos_no_permitidos(self):
        auth = self.login("admin@a.test")
        self.assertEqual(self.deducir(auth, motivo="").status_code, 400)
        self.assertEqual(self.deducir(auth, motivo="   ").status_code, 400)
        r = self.deducir(auth, monto="50.00")
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "deduccion"))
        self.assertEqual(self.deducir(auth, tipo="AJUSTE").status_code, 400)
        self.assertEqual(self.deducir(auth, tipo="EXCEDENTE").status_code, 400)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(MovimientoNomina.objects.count(), 0)

    def test_especialista_inexistente_o_de_otro_salon_da_404(self):
        auth = self.login("admin@a.test")
        self.assertEqual(self.deducir(auth, especialista_id=str(self.esp_b.id)).status_code, 404)

    def test_solo_quien_aprueba_liquidaciones_puede_registrarla(self):
        for email in ("esp@a.test", "lector@a.test"):
            self.assertEqual(self.deducir(self.login(email)).status_code, 403)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__permiso="LIQUIDACION_APROBAR").exists())

    def test_deja_auditoria_y_nunca_se_borra(self):
        r = self.deducir(self.login("admin@a.test"))
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(entidad="movimiento_nomina", accion="CREAR", entidad_id=r.json()["id"]).exists())
            with self.assertRaises(DatabaseError), transaction.atomic():
                MovimientoNomina.objects.filter(id=r.json()["id"]).delete()

    def test_la_base_rechaza_un_movimiento_positivo_que_no_es_ajuste(self):
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            MovimientoNomina.objects.create(salon_id=self.salon_a, especialista_id=self.paty.id, tipo="FALTA",
                                            monto=D("10"), motivo="x", fecha=INI)


class GenerarBorradorTests(NominaTestCase):
    def test_total_verificable_sueldo_mas_comision_mas_propina_menos_deducciones(self):
        admin = self.login("admin@a.test")
        self.vender(admin, propina="10.00")
        self.vender(admin)
        self.deducir(admin, monto="-50.00", motivo="Material usado")
        r = self.generar(admin)
        self.assertEqual(r.status_code, 201, r.content)
        d = r.json()
        # sueldo 1500 + comisión 2 × 42 + propina 10 − 50
        self.assertEqual((d["sueldo_fijo"], d["total_comision"], d["total_propina"], d["total_movimientos"], d["neto"], d["excedente"]),
                         ("1500.00", "84.00", "10.00", "-50.00", "1544.00", "0.00"))
        self.assertEqual(d["estado"], "BORRADOR")
        self.assertEqual((d["periodo_inicio"], d["periodo_fin"]), (INI.isoformat(), FIN.isoformat()))

    def test_el_detalle_reproduce_el_total_por_concepto(self):
        admin = self.login("admin@a.test")
        self.vender(admin, propina="10.00")
        self.deducir(admin)
        d = self.generar(admin).json()
        self.assertEqual(sum(D(l["comision"]) for l in d["lineas"]), D(d["total_comision"]))
        self.assertEqual(sum(D(l["propina"]) for l in d["lineas"]), D(d["total_propina"]))
        self.assertEqual(sum(D(m["monto"]) for m in d["movimientos"]), D(d["total_movimientos"]))
        self.assertEqual(D(d["neto"]) - D(d["excedente"]),
                         D(d["sueldo_fijo"]) + D(d["total_comision"]) + D(d["total_propina"]) + D(d["total_movimientos"]))
        leido = self.client.get(f"{LIST}{d['id']}/", **admin).json()
        self.assertEqual((leido["neto"], len(leido["lineas"]), len(leido["movimientos"])), (d["neto"], 1, 1))

    def test_solo_cuenta_lo_de_esa_especialista_y_lo_confirmado(self):
        admin = self.login("admin@a.test")
        self.vender(admin)
        self.vender(admin, especialista=self.kathe.id)
        anulada = self.vender(admin)
        self.post(admin, {"motivo": "Error"}, ruta=f"/api/v1/ventas/{anulada['id']}/anular/")
        d = self.generar(admin).json()
        self.assertEqual((d["total_comision"], len(d["lineas"])), ("42.00", 1))
        k = self.generar(admin, especialista=self.kathe.id).json()
        self.assertEqual((k["sueldo_fijo"], k["total_comision"], k["neto"]), ("0.00", "42.00", "42.00"))

    def test_regenerar_el_borrador_lo_actualiza_sin_duplicarlo(self):
        admin = self.login("admin@a.test")
        primero = self.generar(admin).json()
        self.assertEqual(primero["total_comision"], "0.00")
        self.vender(admin)
        segundo = self.generar(admin).json()
        self.assertEqual((segundo["id"], segundo["total_comision"]), (primero["id"], "42.00"))
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(Liquidacion.objects.count(), 1)

    def test_un_borrador_no_bloquea_anular_ventas(self):
        admin = self.login("admin@a.test")
        venta = self.vender(admin)
        self.generar(admin)
        self.assertEqual(self.post(admin, {"motivo": "Error"}, ruta=f"/api/v1/ventas/{venta['id']}/anular/").status_code, 200)
        self.assertEqual(self.generar(admin).json()["total_comision"], "0.00")

    def test_total_negativo_da_neto_cero_y_excedente_que_pasa_a_la_semana_siguiente(self):
        admin = self.login("admin@a.test")
        self.deducir(admin, especialista_id=str(self.kathe.id), monto="-80.00", tipo="MATERIAL", motivo="Tinte")
        d = self.generar(admin, especialista=self.kathe.id).json()
        self.assertEqual((d["neto"], d["excedente"]), ("0.00", "80.00"))
        # aprobada la semana (aquí directo; la aprobación llega con F03-T3), el excedente entra como deducción
        with tenancy.en_salon(self.salon_a, self.admin_a):
            Liquidacion.objects.filter(id=d["id"]).update(estado="APROBADA", aprobada_por=self.admin_a)
        siguiente = FIN + timedelta(days=1)
        d2 = self.generar(admin, especialista=self.kathe.id, fecha=siguiente).json()
        self.assertEqual((d2["total_movimientos"], d2["neto"], d2["excedente"]), ("-80.00", "0.00", "80.00"))
        self.assertEqual([m["tipo"] for m in d2["movimientos"]], ["EXCEDENTE"])
        d3 = self.generar(admin, especialista=self.kathe.id, fecha=siguiente).json()
        self.assertEqual(len(d3["movimientos"]), 1)  # regenerar no duplica el arrastre

    def test_una_semana_aprobada_no_se_recalcula_ni_acepta_deducciones(self):
        admin = self.login("admin@a.test")
        d = self.generar(admin).json()
        with tenancy.en_salon(self.salon_a, self.admin_a):
            Liquidacion.objects.filter(id=d["id"]).update(estado="APROBADA", aprobada_por=self.admin_a)
        r = self.generar(admin)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "ya_aprobada"))
        r = self.deducir(admin)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "periodo_cerrado"))

    def test_usa_el_dia_de_corte_del_salon(self):
        with tenancy.en_salon(self.salon_a, self.admin_a):
            Salon.objects.filter(id=self.salon_a).update(dia_corte_semana=5)
        d = self.generar(self.login("admin@a.test")).json()
        self.assertEqual(date.fromisoformat(d["periodo_fin"]).weekday(), 5)

    def test_avisa_de_lineas_anteriores_a_f02_sin_comision(self):
        import uuid
        from apps.sales.persistence.models import LineaVenta, Venta
        with tenancy.en_salon(self.salon_a, self.admin_a):
            venta = Venta.objects.create(salon_id=self.salon_a, registrado_por=self.admin_a, uuid_cliente=uuid.uuid4(),
                                         fecha_servicio=timezone.now(), estado=Venta.Estado.CONFIRMADA)
            LineaVenta.objects.create(salon_id=self.salon_a, venta=venta, servicio_id=self.corte.id,
                                      especialista_id=self.paty.id, precio_lista=D("120"), importe_cobrado=D("120"))
        d = self.generar(self.login("admin@a.test")).json()
        self.assertEqual((d["lineas_sin_comision"], d["total_comision"], len(d["lineas"])), (1, "0.00", 1))

    def test_permisos_y_aislamiento(self):
        admin = self.login("admin@a.test")
        self.vender(admin)
        d = self.generar(admin).json()
        self.assertEqual(self.generar(self.login("esp@a.test")).status_code, 403)
        self.assertEqual(self.client.get(LIST, **self.login("lector@a.test")).status_code, 403)
        otro = self.login("admin@b.test")
        self.assertEqual(self.client.get(LIST, **otro).json(), [])
        self.assertEqual(self.client.get(f"{LIST}{d['id']}/", **otro).status_code, 404)
        self.assertEqual(self.generar(otro).status_code, 404)  # su especialista no existe en el salón B
        self.assertEqual(self.client.get(LIST).status_code, 401)

    def test_listado_filtra_por_especialista(self):
        admin = self.login("admin@a.test")
        self.generar(admin)
        self.generar(admin, especialista=self.kathe.id)
        self.assertEqual(len(self.client.get(LIST, **admin).json()), 2)
        r = self.client.get(LIST, {"especialista_id": str(self.kathe.id)}, **admin).json()
        self.assertEqual([x["especialista_id"] for x in r], [str(self.kathe.id)])


class InmutabilidadEnLaBaseTests(NominaTestCase):
    def aprobada(self):
        d = self.generar(self.login("admin@a.test")).json()
        with tenancy.en_salon(self.salon_a, self.admin_a):
            Liquidacion.objects.filter(id=d["id"]).update(estado="APROBADA", aprobada_por=self.admin_a)
        return d["id"]

    def test_rn05_una_liquidacion_aprobada_solo_admite_pagada_y_comprobante(self):
        lid = self.aprobada()
        with tenancy.en_salon(self.salon_a):
            for cambio in ({"neto": D("1")}, {"sueldo_fijo": D("1")}, {"estado": "BORRADOR"}):
                with self.subTest(cambio=cambio), self.assertRaises(DatabaseError), transaction.atomic():
                    Liquidacion.objects.filter(id=lid).update(**cambio)
            with self.assertRaises(DatabaseError), transaction.atomic():
                Liquidacion.objects.filter(id=lid).delete()
            Liquidacion.objects.filter(id=lid).update(estado="PAGADA", comprobante_url="https://x/y.pdf")

    def test_rn05_nada_entra_a_una_liquidacion_aprobada(self):
        lid = self.aprobada()
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            MovimientoNomina.objects.create(salon_id=self.salon_a, especialista_id=self.paty.id, liquidacion_id=lid,
                                            tipo="FALTA", monto=D("-5"), motivo="x", fecha=INI)

    def test_la_base_rechaza_un_neto_que_no_cuadra(self):
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            Liquidacion.objects.create(salon_id=self.salon_a, especialista_id=self.paty.id, periodo_inicio=INI,
                                       periodo_fin=FIN, sueldo_fijo=D("100"), neto=D("99"))

    def test_clave_unica_por_especialista_y_semana_y_rls(self):
        self.generar(self.login("admin@a.test"))
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            Liquidacion.objects.create(salon_id=self.salon_a, especialista_id=self.paty.id, periodo_inicio=INI, periodo_fin=FIN)
        with tenancy.en_salon(self.salon_b), connection.cursor() as c:
            c.execute("SELECT count(*) FROM liquidacion")
            self.assertEqual(c.fetchone()[0], 0)
