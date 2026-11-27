"""F03-T6 / CP-06 / HU-09: «Mi liquidación» de la especialista."""

from apps.audit.persistence.models import Auditoria
from apps.identity import contracts as identidad
from apps.identity.tests.base import CLAVE
from apps.payroll.tests.test_aprobacion import AprobarTestCase
from shared import tenancy

MIS = "/api/v1/nomina/mis-liquidaciones/"


class MiLiquidacionTests(AprobarTestCase):
    """`esp@a.test` es Paty; Katherine no tiene usuario."""

    def aprobar_semana(self, admin, especialista):
        self.vender(admin, especialista=especialista, propina="10.00")
        lid = self.borrador(admin, especialista=especialista)["id"]
        self.aprobar(admin, lid)
        return lid

    def test_la_especialista_ve_su_liquidacion_aprobada_con_detalle(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        lid = self.aprobar_semana(admin, self.paty.id)
        listado = self.client.get(MIS, **esp)
        self.assertEqual((listado.status_code, [l["id"] for l in listado.json()]), (200, [lid]))
        d = self.client.get(f"{MIS}{lid}/", **esp).json()
        self.assertEqual((d["estado"], d["neto"], d["total_propina"], len(d["lineas"])), ("APROBADA", "1552.00", "10.00", 1))

    def test_cp06_pedir_la_liquidacion_de_otra_da_403_y_queda_registrado(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        ajena = self.aprobar_semana(admin, self.kathe.id)
        r = self.client.get(f"{MIS}{ajena}/", **esp)
        self.assertEqual(r.status_code, 403)
        self.assertNotIn("neto", r.json())  # la respuesta no filtra datos de la ajena
        with tenancy.en_salon(self.salon_a):
            registro = Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__ruta=f"{MIS}{ajena}/")
            self.assertTrue(registro.exists())
            self.assertEqual(registro.first().valor_nuevo["permiso"], "LIQUIDACION_VER_PROPIA")

    def test_el_listado_no_incluye_las_de_otras_ni_los_borradores(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        self.aprobar_semana(admin, self.kathe.id)
        self.borrador(admin)  # borrador de Paty
        self.assertEqual(self.client.get(MIS, **esp).json(), [])

    def test_un_borrador_propio_tampoco_se_ve_y_da_403(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        lid = self.borrador(admin)["id"]
        self.assertEqual(self.client.get(f"{MIS}{lid}/", **esp).status_code, 403)

    def test_un_id_inexistente_da_403_igual_que_uno_ajeno(self):
        esp = self.login("esp@a.test")
        self.assertEqual(self.client.get(f"{MIS}00000000-0000-0000-0000-000000000001/", **esp).status_code, 403)

    def test_una_liquidacion_de_otro_salon_da_403(self):
        admin_b = self.login("admin@b.test")
        otra = self.client.get(MIS, **admin_b)  # admin B no es especialista
        self.assertEqual(otra.status_code, 403)

    def test_un_usuario_especialista_sin_ficha_recibe_403(self):
        sin_ficha = identidad.crear_usuario(self.salon_a, nombre="Sin ficha", email="sinficha@a.test", password=CLAVE,
                                            roles=[identidad.ESPECIALISTA])
        self.assertIsNotNone(sin_ficha)
        self.assertEqual(self.client.get(MIS, **self.login("sinficha@a.test")).status_code, 403)

    def test_la_administradora_y_el_lector_no_usan_la_vista_propia(self):
        # la administradora tiene todos los permisos pero no es una especialista: no tiene «propia»
        self.assertEqual(self.client.get(MIS, **self.login("admin@a.test")).status_code, 403)
        self.assertEqual(self.client.get(MIS, **self.login("lector@a.test")).status_code, 403)
        self.assertEqual(self.client.get(MIS).status_code, 401)

    def test_la_especialista_no_entra_a_las_rutas_de_administracion_de_nomina(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        lid = self.aprobar_semana(admin, self.paty.id)
        for ruta in ("/api/v1/nomina/liquidaciones/", f"/api/v1/nomina/liquidaciones/{lid}/"):
            self.assertEqual(self.client.get(ruta, **esp).status_code, 403)
        self.assertEqual(self.client.post(f"/api/v1/nomina/liquidaciones/{lid}/aprobar/", **esp).status_code, 403)
