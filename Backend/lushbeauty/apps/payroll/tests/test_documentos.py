"""F03-T4 / RN-08: comprobante PDF por especialista y resumen XLSX."""

import re
from datetime import date
from decimal import Decimal as D
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

from django.test import SimpleTestCase
from openpyxl import load_workbook

from apps.audit.persistence.models import Auditoria
from apps.payroll.services import documentos
from apps.payroll.tests.test_aprobacion import AprobarTestCase
from shared import tenancy

LIST = "/api/v1/nomina/liquidaciones/"
MIS = "/api/v1/nomina/mis-liquidaciones/"


def texto_del_pdf(contenido: bytes) -> str:
    """Texto de un PDF sin comprimir: decodifica los escapes de cadena de PDF (`\\363` → ó, `\\(` → `(`)."""
    crudo = contenido.decode("latin-1")
    crudo = re.sub(r"\\([0-7]{3})", lambda m: chr(int(m.group(1), 8)), crudo)
    return crudo.replace("\\(", "(").replace("\\)", ")")


def liq(**kw):
    base = dict(periodo_inicio=date(2026, 6, 1), periodo_fin=date(2026, 6, 7), estado="APROBADA", sueldo_fijo=D("1500"),
                total_comision=D("84"), total_propina=D("10"), total_movimientos=D("-30"), excedente=D("0"), neto=D("1564"),
                especialista_id=uuid4())
    return SimpleNamespace(**{**base, **kw})


class FormatoTests(SimpleTestCase):
    def test_dinero_con_dos_decimales_y_miles(self):
        self.assertEqual(documentos.bs(D("1552")), "Bs 1 552.00")
        self.assertEqual(documentos.bs(D("-30.5")), "Bs -30.50")

    def test_una_celda_que_parece_formula_se_neutraliza(self):
        for peligroso in ("=SUMA(A1)", "+1", "-1", "@x"):
            self.assertEqual(documentos._texto_seguro(peligroso), "'" + peligroso)
        self.assertEqual(documentos._texto_seguro("Paty"), "Paty")
        self.assertEqual(documentos._texto_seguro(None), "")

    def test_el_xlsx_trae_numeros_y_fechas_reales(self):
        eid = uuid4()
        libro = load_workbook(BytesIO(documentos.resumen_xlsx([liq(especialista_id=eid)], {eid: "=HYPERLINK(1)"})))
        hoja = libro["Liquidaciones"]
        fila = [c.value for c in hoja[2]]
        self.assertEqual(fila[0], "'=HYPERLINK(1)")
        self.assertEqual(fila[3:], ["Aprobada", 1500, 84, 10, -30, 0, 1564])
        self.assertTrue(all(isinstance(v, (int, float)) for v in fila[4:]))
        self.assertEqual(hoja["B2"].number_format, "yyyy-mm-dd")


class DocumentosTestCase(AprobarTestCase):
    def aprobada(self, admin, especialista, propina="10.00"):
        self.vender(admin, especialista=especialista, propina=propina)
        self.deducir(admin, especialista_id=str(especialista), monto="-30.00", tipo="MATERIAL", motivo="Tinte usado")
        lid = self.borrador(admin, especialista=especialista)["id"]
        self.aprobar(admin, lid)
        return lid


class ComprobanteTests(DocumentosTestCase):
    def test_la_administradora_descarga_el_pdf_de_una_aprobada(self):
        admin = self.login("admin@a.test")
        lid = self.aprobada(admin, self.paty.id)
        r = self.client.get(f"{LIST}{lid}/pdf/", **admin)
        self.assertEqual((r.status_code, r["Content-Type"]), (200, "application/pdf"))
        self.assertTrue(r.content.startswith(b"%PDF"))
        self.assertIn("attachment", r["Content-Disposition"])
        self.assertIn("no-store", r["Cache-Control"])

    def test_el_pdf_trae_los_datos_de_su_destinataria(self):
        admin = self.login("admin@a.test")
        lid = self.aprobada(admin, self.paty.id)
        texto = texto_del_pdf(self.client.get(f"{LIST}{lid}/pdf/", **admin).content)
        for esperado in ("Paty", "Salón A (sintético)", "Neto a pagar", "Bs 1 522.00", "Tinte usado", "Corte", "Aprobada"):
            self.assertIn(esperado, texto)

    def test_la_especialista_descarga_su_pdf_y_no_trae_datos_de_otra(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        propia = self.aprobada(admin, self.paty.id)
        self.aprobada(admin, self.kathe.id)
        r = self.client.get(f"{MIS}{propia}/pdf/", **esp)
        self.assertEqual((r.status_code, r["Content-Type"]), (200, "application/pdf"))
        texto = texto_del_pdf(r.content)
        self.assertIn("Paty", texto)
        self.assertNotIn("Katherine", texto)

    def test_rn08_pedir_el_pdf_de_otra_da_403_y_queda_registrado(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        ajena = self.aprobada(admin, self.kathe.id)
        r = self.client.get(f"{MIS}{ajena}/pdf/", **esp)
        self.assertEqual(r.status_code, 403)
        self.assertNotEqual(r["Content-Type"], "application/pdf")
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="ACCESO_DENEGADO", valor_nuevo__ruta=f"{MIS}{ajena}/pdf/").exists())

    def test_la_especialista_no_usa_la_ruta_de_administracion(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        lid = self.aprobada(admin, self.paty.id)
        self.assertEqual(self.client.get(f"{LIST}{lid}/pdf/", **esp).status_code, 403)

    def test_un_borrador_no_tiene_comprobante(self):
        admin, esp = self.login("admin@a.test"), self.login("esp@a.test")
        lid = self.borrador(admin)["id"]
        r = self.client.get(f"{LIST}{lid}/pdf/", **admin)
        self.assertEqual((r.status_code, r.json()["codigo"]), (409, "borrador"))
        self.assertEqual(self.client.get(f"{MIS}{lid}/pdf/", **esp).status_code, 403)

    def test_otro_salon_y_sin_sesion(self):
        admin = self.login("admin@a.test")
        lid = self.aprobada(admin, self.paty.id)
        self.assertEqual(self.client.get(f"{LIST}{lid}/pdf/", **self.login("admin@b.test")).status_code, 404)
        self.assertEqual(self.client.get(f"{LIST}{lid}/pdf/").status_code, 401)

    def test_inexistente_da_404_para_la_administradora(self):
        self.assertEqual(self.client.get(f"{LIST}00000000-0000-0000-0000-000000000001/pdf/", **self.login("admin@a.test")).status_code, 404)

    def test_descargar_deja_una_entrada_exportar_sin_el_contenido(self):
        admin = self.login("admin@a.test")
        lid = self.aprobada(admin, self.paty.id)
        self.client.get(f"{LIST}{lid}/pdf/", **admin)
        with tenancy.en_salon(self.salon_a):
            e = Auditoria.objects.get(accion="EXPORTAR", entidad="liquidacion", entidad_id=lid)
        self.assertEqual(e.valor_nuevo, {"formato": "pdf"})


class ExportarXlsxTests(DocumentosTestCase):
    def test_exporta_una_fila_por_liquidacion_con_nombres(self):
        admin = self.login("admin@a.test")
        self.aprobada(admin, self.paty.id)
        self.aprobada(admin, self.kathe.id, propina="0.00")
        r = self.client.get(f"{LIST}exportar/", **admin)
        self.assertEqual(r.status_code, 200)
        self.assertIn("spreadsheetml", r["Content-Type"])
        hoja = load_workbook(BytesIO(r.content))["Liquidaciones"]
        filas = {f[0]: f for f in hoja.iter_rows(min_row=2, values_only=True)}
        self.assertEqual(set(filas), {"Paty", "Katherine"})
        self.assertEqual((filas["Paty"][3], float(filas["Paty"][9])), ("Aprobada", 1522.0))

    def test_filtra_por_periodo_y_valida_fechas(self):
        admin = self.login("admin@a.test")
        self.aprobada(admin, self.paty.id)
        vacio = load_workbook(BytesIO(self.client.get(f"{LIST}exportar/", {"desde": "2020-01-01", "hasta": "2020-01-31"}, **admin).content))
        self.assertEqual(vacio["Liquidaciones"].max_row, 1)
        self.assertEqual(self.client.get(f"{LIST}exportar/", {"desde": "mañana"}, **admin).status_code, 400)

    def test_solo_la_administradora_y_deja_registro(self):
        admin = self.login("admin@a.test")
        self.aprobada(admin, self.paty.id)
        self.assertEqual(self.client.get(f"{LIST}exportar/", **self.login("esp@a.test")).status_code, 403)
        self.assertEqual(self.client.get(f"{LIST}exportar/", **self.login("lector@a.test")).status_code, 403)
        self.client.get(f"{LIST}exportar/", **admin)
        with tenancy.en_salon(self.salon_a):
            self.assertTrue(Auditoria.objects.filter(accion="EXPORTAR", valor_nuevo__formato="xlsx").exists())

    def test_no_exporta_liquidaciones_de_otro_salon(self):
        self.aprobada(self.login("admin@a.test"), self.paty.id)
        hoja = load_workbook(BytesIO(self.client.get(f"{LIST}exportar/", **self.login("admin@b.test")).content))["Liquidaciones"]
        self.assertEqual(hoja.max_row, 1)
