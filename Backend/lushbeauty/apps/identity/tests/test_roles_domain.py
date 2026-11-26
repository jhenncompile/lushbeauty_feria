from django.test import SimpleTestCase

from apps.identity.domain import roles


class RolesDominioTests(SimpleTestCase):
    def test_especialista_no_administra(self):
        permisos = roles.permisos_de_roles([roles.ESPECIALISTA])
        self.assertNotIn("ADMIN_USUARIOS", permisos)
        self.assertNotIn("LIQUIDACION_APROBAR", permisos)
        self.assertIn("VENTA_REGISTRAR", permisos)

    def test_administradora_tiene_todo(self):
        self.assertEqual(roles.permisos_de_roles([roles.ADMINISTRADORA]), frozenset(roles.PERMISOS))

    def test_lector_solo_reportes(self):
        self.assertEqual(roles.permisos_de_roles([roles.LECTOR]), frozenset({"REPORTES_VER"}))

    def test_rol_desconocido_no_da_permisos(self):
        self.assertEqual(roles.permisos_de_roles(["INVENTADO"]), frozenset())

    def test_todo_permiso_asignado_existe_en_el_catalogo(self):
        for asignados in roles.PERMISOS_POR_ROL.values():
            self.assertLessEqual(asignados, set(roles.PERMISOS))
