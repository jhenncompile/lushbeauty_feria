import json
from datetime import date, timedelta

from django.db import DatabaseError, IntegrityError, connection, transaction
from django.utils import timezone

from apps.audit.persistence.models import Auditoria
from apps.catalog import contracts as catalogo
from apps.commissions import contracts as comisiones
from apps.commissions.persistence.models import ReglaComision
from apps.identity.tests.base import DosSalonesTestCase
from shared import tenancy

URL = "/api/v1/comisiones/reglas/"
HOY = timezone.localdate()


class ComisionesTestCase(DosSalonesTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        with tenancy.en_salon(cls.salon_a, cls.admin_a):
            cls.paty = catalogo.crear_especialista(nombre="Paty")
            cls.general = comisiones.crear_version(
                porcentaje="0.35", base=comisiones.PRECIO_LISTA, desde=date(2026, 1, 1), motivo="Política inicial")

    def post(self, auth, **cuerpo):
        base = {"porcentaje": "0.40", "base": "PRECIO_LISTA", "motivo": "Subida acordada",
                "vigente_desde": (HOY + timedelta(days=7)).isoformat()}
        return self.client.post(URL, data=json.dumps({**base, **cuerpo}), content_type="application/json", **auth)


class VersionadoApiTests(ComisionesTestCase):
    def test_publicar_version_cierra_la_anterior_y_conserva_el_motivo(self):
        auth = self.login("admin@a.test")
        desde = HOY + timedelta(days=7)
        r = self.post(auth, vigente_desde=desde.isoformat())
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["motivo"], "Subida acordada")
        historial = self.client.get(URL, {"ambito": "general"}, **auth).json()
        self.assertEqual([h["porcentaje"] for h in historial], ["0.4000", "0.3500"])
        anterior = historial[1]
        self.assertEqual(anterior["vigente_hasta"], (desde - timedelta(days=1)).isoformat())
        self.assertEqual(anterior["motivo"], "Política inicial")  # no se pisó

    def test_regla_propia_para_una_especialista(self):
        auth = self.login("admin@a.test")
        r = self.post(auth, especialista_id=str(self.paty.id), porcentaje="0.45")
        self.assertEqual(r.status_code, 201, r.content)
        propias = self.client.get(URL, {"especialista_id": str(self.paty.id)}, **auth).json()
        self.assertEqual(len(propias), 1)

    def test_rechaza_motivo_vacio_inicio_pasado_y_porcentaje_fuera_de_rango(self):
        auth = self.login("admin@a.test")
        self.assertEqual(self.post(auth, motivo="  ").status_code, 400)
        self.assertEqual(self.post(auth, vigente_desde=(HOY - timedelta(days=1)).isoformat()).status_code, 422)
        self.assertEqual(self.post(auth, porcentaje="1.5").status_code, 400)

    def test_especialista_inexistente_da_422(self):
        auth = self.login("admin@a.test")
        self.assertEqual(self.post(auth, especialista_id="00000000-0000-0000-0000-000000000001").status_code, 422)

    def test_especialista_y_lector_no_acceden_y_queda_registrado(self):
        auth = self.login("esp@a.test")
        self.assertEqual(self.client.get(URL, **auth).status_code, 403)
        self.assertEqual(self.post(auth).status_code, 403)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__ruta=URL).exists())

    def test_cada_salon_ve_solo_sus_reglas(self):
        auth = self.login("admin@b.test")
        self.assertEqual(self.client.get(URL, **auth).json(), [])

    def test_una_publicacion_deja_auditoria(self):
        auth = self.login("admin@a.test")
        self.post(auth)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(entidad="regla_comision", accion="CREAR").count() >= 2)
            self.assertTrue(Auditoria.objects.filter(entidad="regla_comision", accion="MODIFICAR").exists())


class ReglasEnLaBaseTests(ComisionesTestCase):
    """Lo que la base garantiza aunque la aplicación falle."""

    def _insertar(self, **campos):
        datos = dict(salon_id=self.salon_a, porcentaje="0.2", base="PRECIO_LISTA", motivo="x", **campos)
        with transaction.atomic():
            ReglaComision.objects.create(**datos)

    def test_cp09_no_se_puede_modificar_una_regla_publicada(self):
        with tenancy.en_salon(self.salon_a):
            for cambio in ({"porcentaje": "0.99"}, {"base": "PRECIO_COBRADO"}, {"vigente_desde": date(2025, 1, 1)},
                           {"motivo": "otro"}):
                with self.subTest(cambio=cambio), self.assertRaises(DatabaseError), transaction.atomic():
                    ReglaComision.objects.filter(id=self.general.id).update(**cambio)

    def test_cp09_ponerle_fin_se_permite_una_sola_vez(self):
        with tenancy.en_salon(self.salon_a):
            ReglaComision.objects.filter(id=self.general.id).update(vigente_hasta=date(2026, 12, 31))
            with self.assertRaises(DatabaseError), transaction.atomic():
                ReglaComision.objects.filter(id=self.general.id).update(vigente_hasta=date(2027, 12, 31))

    def test_no_se_borra_una_regla(self):
        with tenancy.en_salon(self.salon_a), self.assertRaises(DatabaseError), transaction.atomic():
            ReglaComision.objects.filter(id=self.general.id).delete()

    def test_la_base_rechaza_vigencias_solapadas_del_mismo_ambito(self):
        with tenancy.en_salon(self.salon_a), self.assertRaises(IntegrityError):
            self._insertar(vigente_desde=date(2026, 6, 1))  # la general sigue abierta desde 2026-01-01

    def test_la_base_permite_vigencias_contiguas_y_otro_ambito(self):
        with tenancy.en_salon(self.salon_a):
            ReglaComision.objects.filter(id=self.general.id).update(vigente_hasta=date(2026, 5, 31))
            self._insertar(vigente_desde=date(2026, 6, 1))
            self._insertar(vigente_desde=date(2026, 1, 1), especialista_id=self.paty.id)

    def test_la_base_rechaza_porcentaje_fuera_de_rango_y_fin_anterior_al_inicio(self):
        invalidas = [
            {"porcentaje": "1.5", "vigente_desde": date(2030, 1, 1)},
            {"porcentaje": "0.1", "vigente_desde": date(2030, 1, 10), "vigente_hasta": date(2030, 1, 1)},
        ]
        with tenancy.en_salon(self.salon_a):
            for campos in invalidas:
                with self.subTest(campos=campos), self.assertRaises(IntegrityError), transaction.atomic():
                    ReglaComision.objects.create(salon_id=self.salon_a, especialista_id=self.paty.id,
                                                 base="PRECIO_LISTA", motivo="x", **campos)

    def test_aislamiento_por_rls_con_sql_crudo(self):
        with tenancy.en_salon(self.salon_b), connection.cursor() as c:
            c.execute("SELECT count(*) FROM regla_comision")
            self.assertEqual(c.fetchone()[0], 0)
