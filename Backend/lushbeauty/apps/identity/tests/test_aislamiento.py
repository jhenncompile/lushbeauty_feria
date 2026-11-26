from django.db import IntegrityError, ProgrammingError, connection, transaction

from apps.identity.persistence.models import Usuario
from apps.identity.tests.base import DosSalonesTestCase
from shared import tenancy


def _contar(sql):
    with connection.cursor() as c:
        c.execute(sql)
        return c.fetchone()[0]


class AislamientoApiTests(DosSalonesTestCase):
    def test_admin_de_a_no_ve_usuario_de_b(self):
        auth = self.login("admin@a.test")
        r = self.client.get(f"/api/identity/usuarios/{self.admin_b}", **auth)
        self.assertEqual(r.status_code, 404)

    def test_admin_de_a_si_ve_usuario_de_su_salon(self):
        auth = self.login("admin@a.test")
        r = self.client.get(f"/api/identity/usuarios/{self.esp_a}", **auth)
        self.assertEqual(r.status_code, 200)


class AislamientoBaseDeDatosTests(DosSalonesTestCase):
    """Estas pruebas ignoran el manager del ORM: demuestran que la base de datos
    misma filtra por salón, no solo que exista la columna `salon_id`."""

    def test_el_rol_de_la_app_no_es_superusuario(self):
        # Un superusuario o un rol con BYPASSRLS saltan las políticas y anulan el aislamiento.
        with connection.cursor() as c:
            c.execute("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user")
            self.assertEqual(c.fetchone(), (False, False))

    def test_sql_crudo_solo_ve_filas_del_salon_activo(self):
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(_contar("SELECT count(*) FROM usuario"), 2)
            self.assertEqual(_contar(f"SELECT count(*) FROM usuario WHERE salon_id = '{self.salon_b}'"), 0)
            self.assertEqual(_contar("SELECT count(*) FROM salon"), 1)
        with tenancy.en_salon(self.salon_b):
            self.assertEqual(_contar("SELECT count(*) FROM usuario"), 1)

    def test_sin_salon_activo_no_se_ve_nada(self):
        tenancy.limpiar()
        self.assertEqual(_contar("SELECT count(*) FROM usuario"), 0)
        self.assertEqual(_contar("SELECT count(*) FROM auditoria"), 0)

    def test_no_se_puede_escribir_en_otro_salon(self):
        with tenancy.en_salon(self.salon_a):
            with self.assertRaises((ProgrammingError, IntegrityError)), transaction.atomic():
                with connection.cursor() as c:
                    c.execute(
                        "INSERT INTO usuario (id, salon_id, nombre, email, password_hash, activo) "
                        "VALUES (gen_random_uuid(), %s, 'intruso', 'x@b.test', 'x', true)",
                        [str(self.salon_b)],
                    )

    def test_no_se_puede_modificar_usuarios_de_otro_salon(self):
        with tenancy.en_salon(self.salon_a):
            with connection.cursor() as c:
                c.execute("UPDATE usuario SET nombre = 'hackeado' WHERE salon_id = %s", [str(self.salon_b)])
                self.assertEqual(c.rowcount, 0)
        with tenancy.en_salon(self.salon_b):
            self.assertEqual(Usuario.objects.get(id=self.admin_b).nombre, "Admin B")

    def test_el_manager_tambien_acota(self):
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(Usuario.objects.count(), 2)
        tenancy.limpiar()
        self.assertEqual(Usuario.objects.count(), 0)
