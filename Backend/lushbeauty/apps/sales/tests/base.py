import json
import uuid
from decimal import Decimal

from datetime import date

from apps.catalog import contracts as catalogo
from apps.commissions import contracts as comisiones
from apps.identity import contracts as identidad
from apps.identity.tests.base import CLAVE, DosSalonesTestCase
from shared import tenancy


class VentasTestCase(DosSalonesTestCase):
    """Salón A con catálogo, una especialista vinculada a su usuario y otra sin usuario; salón B aparte."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.lector_a = identidad.crear_usuario(cls.salon_a, nombre="Lector A", email="lector@a.test",
                                               password=CLAVE, roles=[identidad.LECTOR])
        with tenancy.en_salon(cls.salon_a, cls.admin_a):
            cls.corte = catalogo.crear_servicio(categoria="Cabello", nombre="Corte", precio_lista="120.00",
                                                costo_materiales="15.00")
            cls.tinte = catalogo.crear_servicio(categoria="Color", nombre="Tinte", precio_lista="300.00")
            cls.paty = catalogo.crear_especialista(nombre="Paty", sueldo_fijo="1500.00", usuario_id=cls.esp_a)
            cls.kathe = catalogo.crear_especialista(nombre="Katherine")
            cls.regla_general = comisiones.crear_version(
                porcentaje="0.35", base=comisiones.PRECIO_LISTA, desde=date(2020, 1, 1), motivo="Política base (prueba)")
        with tenancy.en_salon(cls.salon_b, cls.admin_b):
            cls.corte_b = catalogo.crear_servicio(categoria="Cabello", nombre="Corte", precio_lista="90.00")
            cls.esp_b = catalogo.crear_especialista(nombre="Esp B")
            comisiones.crear_version(
                porcentaje="0.50", base=comisiones.PRECIO_COBRADO, desde=date(2020, 1, 1), motivo="Política base B (prueba)")

    def cuerpo(self, *, lineas=None, pagos=None, uuid_cliente=None):
        lineas = lineas or [{"servicio_id": str(self.corte.id), "especialista_id": str(self.paty.id)}]
        pagos = pagos or [{"metodo": "EFECTIVO", "monto": "120.00"}]
        return {"uuid_cliente": str(uuid_cliente or uuid.uuid4()), "lineas": lineas, "pagos": pagos}

    def post(self, auth, cuerpo, ruta="/api/v1/ventas/"):
        return self.client.post(ruta, data=json.dumps(cuerpo), content_type="application/json", **auth)

    def linea(self, servicio=None, especialista=None, **extra):
        return {"servicio_id": str(servicio or self.corte.id), "especialista_id": str(especialista or self.paty.id), **extra}
