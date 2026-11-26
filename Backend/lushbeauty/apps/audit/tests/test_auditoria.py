from django.db import DatabaseError, connection, transaction

from apps.audit.persistence.models import Auditoria
from apps.identity.persistence.models import Usuario
from apps.identity.tests.base import DosSalonesTestCase
from shared import tenancy


class AuditoriaAutomaticaTests(DosSalonesTestCase):
    def test_crear_usuario_deja_entrada_crear_sin_password(self):
        with tenancy.en_salon(self.salon_a):
            entrada = Auditoria.objects.get(accion="CREAR", entidad="usuario", entidad_id=self.admin_a)
        self.assertEqual(entrada.valor_nuevo["email"], "admin@a.test")
        self.assertNotIn("password_hash", entrada.valor_nuevo)

    def test_modificar_un_registro_deja_antes_y_despues_con_actor(self):
        with tenancy.en_salon(self.salon_a, self.admin_a):
            Usuario.objects.filter(id=self.esp_a).update(nombre="Esp A renombrada")
            entrada = Auditoria.objects.get(accion="MODIFICAR", entidad_id=self.esp_a)
        self.assertEqual(entrada.valor_anterior["nombre"], "Esp A")
        self.assertEqual(entrada.valor_nuevo["nombre"], "Esp A renombrada")
        self.assertEqual(entrada.usuario_id, self.admin_a)

    def test_la_auditoria_de_un_salon_no_es_visible_desde_otro(self):
        with tenancy.en_salon(self.salon_b):
            self.assertFalse(Auditoria.objects.filter(entidad_id=self.admin_a).exists())
            with connection.cursor() as c:
                c.execute("SELECT count(*) FROM auditoria WHERE salon_id = %s", [str(self.salon_a)])
                self.assertEqual(c.fetchone()[0], 0)


class BitacoraDeSoloInsercionTests(DosSalonesTestCase):
    def test_no_se_puede_actualizar_ni_borrar_ni_truncar(self):
        with tenancy.en_salon(self.salon_a):
            for sql in ("UPDATE auditoria SET entidad = 'x'", "DELETE FROM auditoria", "TRUNCATE auditoria"):
                with self.subTest(sql=sql), self.assertRaises(DatabaseError), transaction.atomic():
                    with connection.cursor() as c:
                        c.execute(sql)
