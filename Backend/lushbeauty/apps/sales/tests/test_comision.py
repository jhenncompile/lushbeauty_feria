"""F02: la comisión de cada línea se fija con la regla vigente al vender y nunca se recalcula (RN-02, CP-02, CP-09)."""

from datetime import date, datetime, timedelta, timezone as tz
from decimal import Decimal as D

from django.db import DatabaseError, transaction
from django.utils import timezone

from apps.commissions import contracts as comisiones
from apps.sales.persistence.models import LineaVenta
from apps.sales.tests.base import VentasTestCase
from shared import tenancy


class ComisionDeLaLineaTests(VentasTestCase):
    def vender(self, auth, **extra):
        r = self.post(auth, {**self.cuerpo(), **extra})
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()

    def test_cp02_35_por_ciento_sobre_lista_120_guarda_42_y_el_snapshot(self):
        venta = self.vender(self.login("admin@a.test"))
        linea = venta["lineas"][0]
        self.assertEqual((linea["comision"], linea["tasa_comision"], linea["base_comision"]),
                         ("42.00", "0.3500", "PRECIO_LISTA"))
        with tenancy.en_salon(self.salon_a):
            guardada = LineaVenta.objects.get(id=linea["id"])
        self.assertEqual(guardada.regla_comision_id, self.regla_general.id)

    def test_con_descuento_la_base_lista_no_lo_descuenta(self):
        auth = self.login("admin@a.test")
        linea = self.vender(auth, **{
            "lineas": [self.linea(descuento="12.00", motivo_descuento="Frecuente")],
            "pagos": [{"metodo": "QR", "monto": "108.00"}]})["lineas"][0]
        self.assertEqual(linea["comision"], "42.00")

    def test_una_regla_propia_gana_a_la_general(self):
        with tenancy.en_salon(self.salon_a, self.admin_a):
            comisiones.crear_version(porcentaje="0.50", base=comisiones.PRECIO_COBRADO, desde=date(2020, 1, 1),
                                     motivo="Acuerdo especial", especialista_id=self.paty.id)
        linea = self.vender(self.login("admin@a.test"))["lineas"][0]
        self.assertEqual((linea["comision"], linea["base_comision"]), ("60.00", "PRECIO_COBRADO"))

    def test_cp09_cambiar_la_politica_no_recalcula_ventas_pasadas(self):
        auth = self.login("admin@a.test")
        antes = self.vender(auth)["lineas"][0]
        with tenancy.en_salon(self.salon_a, self.admin_a):
            comisiones.crear_version(porcentaje="0.60", base=comisiones.PRECIO_LISTA,
                                     desde=timezone.localdate() + timedelta(days=1), motivo="Nueva política")
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(LineaVenta.objects.get(id=antes["id"]).comision, D("42.00"))
        despues = self.vender(auth)["lineas"][0]  # hoy sigue la vieja: la nueva empieza mañana
        self.assertEqual(despues["comision"], "42.00")

    def test_una_venta_de_otro_dia_usa_la_regla_vigente_ese_dia(self):
        with tenancy.en_salon(self.salon_a, self.admin_a):
            comisiones.crear_version(porcentaje="0.60", base=comisiones.PRECIO_LISTA,
                                     desde=timezone.localdate() + timedelta(days=1), motivo="Nueva política")
        auth = self.login("admin@a.test")
        manana = (timezone.now() + timedelta(days=1)).isoformat()
        r = self.post(auth, {**self.cuerpo(), "fecha_servicio": manana})
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["lineas"][0]["comision"], "72.00")

    def test_sin_regla_vigente_la_venta_se_rechaza_y_no_deja_nada(self):
        auth = self.login("admin@a.test")
        vieja = datetime(2019, 1, 1, 12, tzinfo=tz.utc).isoformat()  # las reglas de prueba empiezan en 2020
        r = self.post(auth, {**self.cuerpo(), "fecha_servicio": vieja})
        self.assertEqual((r.status_code, r.json()["codigo"] if "codigo" in r.json() else None), (422, "sin_regla_comision"))
        with tenancy.en_salon(self.salon_a):
            self.assertFalse(LineaVenta.objects.exists())

    def test_el_snapshot_es_inmutable_en_la_base(self):
        linea = self.vender(self.login("admin@a.test"))["lineas"][0]
        with tenancy.en_salon(self.salon_a):
            for cambio in ({"comision": D("1.00")}, {"tasa_comision": D("0.9")}, {"base_comision": "PRECIO_COBRADO"}):
                with self.subTest(cambio=cambio), self.assertRaises(DatabaseError), transaction.atomic():
                    LineaVenta.objects.filter(id=linea["id"]).update(**cambio)

    def test_la_base_rechaza_una_comision_que_no_sigue_la_formula(self):
        with tenancy.en_salon(self.salon_a):
            from apps.sales.tests.test_paridad_bd import _linea, _venta
            v = _venta(self.salon_a, self.admin_a)
            with self.assertRaises(DatabaseError), transaction.atomic():
                LineaVenta.objects.filter(id=_linea(v, "120.00", 1, "0", None, "120.00").id).update(
                    regla_comision_id=self.regla_general.id, base_comision="PRECIO_LISTA",
                    tasa_comision=D("0.35"), comision=D("41.99"))
