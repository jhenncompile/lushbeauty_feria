"""Paridad dominio ↔ base de datos: lo que el dominio acepta, la BD lo acepta, y viceversa.
Además, las reglas contables que solo impone la BD (no borrar, líneas inmutables)."""

import uuid
from decimal import Decimal as D

from django.db import DatabaseError, connection, transaction
from django.utils import timezone

from apps.sales.domain import calculo
from apps.sales.persistence.models import LineaVenta, Pago, Venta
from apps.sales.tests.base import VentasTestCase
from shared import tenancy


def _venta(salon, usuario, estado=Venta.Estado.PENDIENTE):
    return Venta.objects.create(salon_id=salon, registrado_por=usuario, uuid_cliente=uuid.uuid4(),
                                fecha_servicio=timezone.now(), estado=estado)


def _linea(venta, lista, cant, desc, motivo, importe):
    return LineaVenta.objects.create(
        salon_id=venta.salon_id, venta=venta, servicio_id=uuid.uuid4(), especialista_id=uuid.uuid4(),
        cantidad=cant, precio_lista=D(lista), descuento=D(desc), motivo_descuento=motivo,
        importe_cobrado=D(importe),
    )


class ParidadLineaTests(VentasTestCase):
    CASOS = [
        ("120.00", 1, "8.00", "x", "112.00"),
        ("120.00", 1, "8.00", "x", "111.00"),   # importe mal calculado
        ("120.00", 1, "0.00", None, "120.00"),
        ("120.00", 2, "20.00", "x", "220.00"),
        ("120.00", 1, "8.00", None, "112.00"),  # descuento sin motivo
        ("120.00", 1, "130.00", "x", "-10.00"),  # importe negativo
        ("120.00", 0, "0.00", None, "0.00"),    # cantidad cero
        ("120.00", 1, "-5.00", "x", "125.00"),  # descuento negativo
        ("100.50", 3, "0.50", "promo", "301.00"),
        ("0.10", 3, "0.00", None, "0.30"),
    ]

    def dominio_acepta(self, lista, cant, desc, motivo, importe):
        try:
            linea = calculo.calcular_linea(lista, cant, desc, motivo)
        except calculo.ErrorDeVenta:
            return False
        return linea.importe_cobrado == D(importe)

    def bd_acepta(self, *caso):
        try:
            with transaction.atomic():
                _linea(_venta(self.salon_a, self.admin_a), *caso)
            return True
        except DatabaseError:
            return False

    def test_dominio_y_bd_aceptan_y_rechazan_lo_mismo(self):
        with tenancy.en_salon(self.salon_a, self.admin_a):
            for caso in self.CASOS:
                with self.subTest(caso=caso):
                    self.assertEqual(self.dominio_acepta(*caso), self.bd_acepta(*caso))


class ParidadPagosTests(VentasTestCase):
    def bd_acepta(self, importe_linea, pagos):
        try:
            with transaction.atomic():
                v = _venta(self.salon_a, self.admin_a, Venta.Estado.CONFIRMADA)
                _linea(v, importe_linea, 1, "0", None, importe_linea)
                for monto in pagos:
                    Pago.objects.create(salon_id=v.salon_id, venta=v, metodo="EFECTIVO", monto=D(monto))
                with connection.cursor() as c:
                    c.execute("SET CONSTRAINTS ALL IMMEDIATE")  # fuerza ahora el chequeo diferido de RN-04
                    c.execute("SET CONSTRAINTS ALL DEFERRED")  # y restaura el modo para el siguiente caso
            return True
        except DatabaseError:
            return False

    def test_pagos_que_no_igualan_las_lineas_los_rechaza_la_bd_igual_que_el_dominio(self):
        casos = [("112.00", ["112.00"]), ("112.00", ["100.00"]), ("112.00", ["60.00", "52.00"]),
                 ("112.00", ["60.00", "53.00"]), ("112.00", [])]
        with tenancy.en_salon(self.salon_a, self.admin_a):
            for importe, pagos in casos:
                with self.subTest(importe=importe, pagos=pagos):
                    lineas = [calculo.calcular_linea(importe, 1)]
                    try:
                        calculo.validar_pagos(lineas, [("EFECTIVO", D(p)) for p in pagos])
                        dominio = True
                    except calculo.ErrorDeVenta:
                        dominio = False
                    self.assertEqual(dominio, self.bd_acepta(importe, pagos))


class NadaContableSeBorraTests(VentasTestCase):
    def crear(self):
        auth = self.login("admin@a.test")
        return self.post(auth, self.cuerpo()).json()["id"]

    def test_la_bd_no_deja_borrar_ventas_lineas_ni_pagos(self):
        self.crear()
        with tenancy.en_salon(self.salon_a):
            for tabla in ("pago", "linea_venta", "venta"):
                with self.subTest(tabla=tabla), self.assertRaises(DatabaseError), transaction.atomic():
                    with connection.cursor() as c:
                        c.execute(f"DELETE FROM {tabla}")

    def test_la_linea_confirmada_no_se_modifica_pero_si_se_liquida(self):
        self.crear()
        with tenancy.en_salon(self.salon_a):
            with self.assertRaises(DatabaseError), transaction.atomic():
                LineaVenta.objects.update(importe_cobrado=D("1.00"), precio_lista=D("1.00"))
            self.assertEqual(LineaVenta.objects.update(liquidacion_id=uuid.uuid4()), 1)
