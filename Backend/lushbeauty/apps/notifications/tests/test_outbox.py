import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import IntegrityError, connection, transaction
from django.test import override_settings
from django.utils import timezone  # noqa: F401

from apps.identity.tests.base import DosSalonesTestCase
from apps.notifications import contracts as notif
from apps.notifications.domain import outbox as dominio
from apps.notifications.persistence.models import EventoOutbox
from apps.notifications.services import publicador
from shared import tenancy

import uuid

TIPO = "cierre_caja.aprobado"


def emitir(salon, entidad=None, tipo=TIPO, payload=None):
    entidad = entidad or uuid.uuid4()
    with tenancy.en_salon(salon), transaction.atomic():
        evento, creado = notif.publicar_evento(tipo, entidad, payload or {"fecha": "2026-06-01"})
    return evento, creado, entidad


class PublicarEventoTests(DosSalonesTestCase):
    def test_guarda_el_evento_pendiente(self):
        evento, creado, _ = emitir(self.salon_a)
        self.assertTrue(creado)
        self.assertEqual((evento.estado, evento.intentos, evento.salon_id), ("PENDIENTE", 0, self.salon_a))

    def test_cp08_emitir_dos_veces_el_mismo_hecho_deja_un_solo_aviso(self):
        primero, _, entidad = emitir(self.salon_a)
        segundo, creado, _ = emitir(self.salon_a, entidad=entidad)
        self.assertFalse(creado)
        self.assertEqual(primero.id, segundo.id)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(EventoOutbox.objects.count(), 1)

    def test_otro_tipo_o_entidad_es_otro_evento(self):
        _, _, entidad = emitir(self.salon_a)
        emitir(self.salon_a, entidad=entidad, tipo="otro.tipo")
        emitir(self.salon_a)
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(EventoOutbox.objects.count(), 3)

    def test_nace_y_muere_con_la_transaccion_de_la_operacion(self):
        entidad = uuid.uuid4()
        with tenancy.en_salon(self.salon_a):
            with self.assertRaises(RuntimeError), transaction.atomic():
                notif.publicar_evento(TIPO, entidad, {})
                raise RuntimeError("la operación falló")
            self.assertFalse(EventoOutbox.objects.filter(entidad_id=entidad).exists())

    def test_exige_una_transaccion_abierta(self):
        with tenancy.en_salon(self.salon_a), mock.patch.object(connection, "in_atomic_block", False):
            with self.assertRaises(notif.FueraDeTransaccion):
                notif.publicar_evento(TIPO, uuid.uuid4(), {})

    def test_sin_salon_activo_falla(self):
        with transaction.atomic(), self.assertRaises(ValueError):
            notif.publicar_evento(TIPO, uuid.uuid4(), {})

    def test_un_salon_no_ve_ni_escribe_los_eventos_de_otro(self):
        emitir(self.salon_a)
        with tenancy.en_salon(self.salon_b):
            self.assertEqual(EventoOutbox.objects.count(), 0)
            with connection.cursor() as c:
                c.execute("SELECT count(*) FROM evento_outbox")
                self.assertEqual(c.fetchone()[0], 0)
            with self.assertRaises(Exception), transaction.atomic():
                EventoOutbox.objects.create(salon_id=self.salon_a, tipo=TIPO, entidad_id=uuid.uuid4(), payload={})

    def test_la_base_impide_duplicar_la_clave(self):
        _, _, entidad = emitir(self.salon_a)
        with tenancy.en_salon(self.salon_a), self.assertRaises(IntegrityError), transaction.atomic():
            EventoOutbox.objects.create(salon_id=self.salon_a, tipo=TIPO, entidad_id=entidad, payload={})

    def test_el_outbox_no_se_audita(self):
        emitir(self.salon_a)
        from apps.audit.persistence.models import Auditoria
        with tenancy.en_salon(self.salon_a):
            self.assertFalse(Auditoria.objects.filter(entidad="evento_outbox").exists())


class Recolector:
    def __init__(self, falla=lambda e: False):
        self.vistos, self.falla = [], falla

    def __call__(self, evento):
        self.vistos.append((evento.id, tenancy.salon_actual()))
        if self.falla(evento):
            raise ConnectionError("n8n no responde")


class PublicadorTests(DosSalonesTestCase):
    def estado(self, salon, evento_id):
        with tenancy.en_salon(salon):
            return EventoOutbox.objects.get(id=evento_id)

    def test_envia_y_marca_enviado(self):
        e, *_ = emitir(self.salon_a)
        envio = Recolector()
        cuenta = publicador.publicar_pendientes(envio)
        self.assertEqual(cuenta, {"enviados": 1, "fallidos": 0, "reintentables": 0})
        guardado = self.estado(self.salon_a, e.id)
        self.assertEqual((guardado.estado, guardado.intentos), ("ENVIADO", 1))
        self.assertIsNotNone(guardado.enviado_en)

    def test_un_evento_enviado_no_se_vuelve_a_enviar(self):
        emitir(self.salon_a)
        envio = Recolector()
        publicador.publicar_pendientes(envio)
        publicador.publicar_pendientes(envio)
        self.assertEqual(len(envio.vistos), 1)

    def test_procesa_cada_salon_con_su_contexto(self):
        a, *_ = emitir(self.salon_a)
        b, *_ = emitir(self.salon_b)
        envio = Recolector()
        publicador.publicar_pendientes(envio)
        self.assertEqual(sorted(envio.vistos), sorted([(a.id, self.salon_a), (b.id, self.salon_b)]))
        self.assertIsNone(tenancy.salon_actual())  # no deja un salón activo

    def test_un_fallo_se_registra_y_se_reintenta_sin_frenar_al_resto(self):
        malo, *_ = emitir(self.salon_a)
        bueno, *_ = emitir(self.salon_a)
        cuenta = publicador.publicar_pendientes(Recolector(lambda e: e.id == malo.id))
        self.assertEqual(cuenta, {"enviados": 1, "fallidos": 0, "reintentables": 1})
        g = self.estado(self.salon_a, malo.id)
        self.assertEqual((g.estado, g.intentos), ("PENDIENTE", 1))
        self.assertIn("ConnectionError", g.ultimo_error)
        self.assertEqual(self.estado(self.salon_a, bueno.id).estado, "ENVIADO")

    def test_agotados_los_intentos_queda_fallido_y_no_se_toma_mas(self):
        e, *_ = emitir(self.salon_a)
        envio = Recolector(lambda _: True)
        for _ in range(3):
            publicador.publicar_pendientes(envio, max_intentos=3)
        self.assertEqual(self.estado(self.salon_a, e.id).estado, "FALLIDO")
        publicador.publicar_pendientes(envio, max_intentos=3)
        self.assertEqual(len(envio.vistos), 3)

    def test_reintentar_devuelve_un_fallido_a_la_cola(self):
        e, *_ = emitir(self.salon_a)
        publicador.publicar_pendientes(Recolector(lambda _: True), max_intentos=1)
        with tenancy.en_salon(self.salon_a):
            self.assertIsNotNone(notif.reintentar(e.id))
        g = self.estado(self.salon_a, e.id)
        self.assertEqual((g.estado, g.intentos, g.ultimo_error), ("PENDIENTE", 0, None))
        publicador.publicar_pendientes(Recolector())
        self.assertEqual(self.estado(self.salon_a, e.id).estado, "ENVIADO")

    def test_no_se_reintenta_un_evento_ya_enviado(self):
        e, *_ = emitir(self.salon_a)
        publicador.publicar_pendientes(Recolector())
        with tenancy.en_salon(self.salon_a):
            self.assertIsNone(notif.reintentar(e.id))

    def test_el_lote_limita_cuantos_se_toman(self):
        for _ in range(3):
            emitir(self.salon_a)
        envio = Recolector()
        publicador.publicar_pendientes(envio, lote=2)
        self.assertEqual(len(envio.vistos), 2)

    def test_la_politica_de_lectura_no_permite_escribir_sin_salon(self):
        emitir(self.salon_a)
        with connection.cursor() as c:
            c.execute("SELECT set_config('app.publicador', 'on', false)")
            try:
                with self.assertRaises(Exception), transaction.atomic():
                    c.execute("UPDATE evento_outbox SET estado = 'ENVIADO'")
                    if c.rowcount == 0:
                        raise AssertionError("no actualizó nada")
            finally:
                c.execute("SELECT set_config('app.publicador', '', false)")
        with tenancy.en_salon(self.salon_a):
            self.assertEqual(EventoOutbox.objects.get().estado, "PENDIENTE")


class _Receptor(BaseHTTPRequestHandler):
    recibidos: list = []
    codigo = 200

    def do_POST(self):
        cuerpo = self.rfile.read(int(self.headers["Content-Length"]))
        _Receptor.recibidos.append((dict(self.headers), cuerpo))
        self.send_response(_Receptor.codigo)
        self.end_headers()

    def log_message(self, *args):
        pass


class TransporteHttpTests(DosSalonesTestCase):
    def setUp(self):
        _Receptor.recibidos, _Receptor.codigo = [], 200
        self.servidor = HTTPServer(("127.0.0.1", 0), _Receptor)
        threading.Thread(target=self.servidor.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.servidor.server_port}/hook"
        self.addCleanup(self.servidor.shutdown)

    def test_envia_el_evento_firmado_y_verificable(self):
        e, *_ = emitir(self.salon_a, payload={"fecha": "2026-06-01"})
        publicador.publicar_pendientes(publicador.transporte_http(self.url, "secreto"))
        cabeceras, cuerpo = _Receptor.recibidos[0]
        self.assertEqual(cabeceras["X-Lush-Event-Id"], str(e.id))
        self.assertTrue(dominio.firma_valida("secreto", int(cabeceras["X-Lush-Timestamp"]), cuerpo, cabeceras["X-Lush-Signature"]))
        self.assertFalse(dominio.firma_valida("otro", int(cabeceras["X-Lush-Timestamp"]), cuerpo, cabeceras["X-Lush-Signature"]))
        self.assertIn(str(e.id).encode(), cuerpo)

    def test_una_respuesta_de_error_cuenta_como_fallo(self):
        _Receptor.codigo = 500
        e, *_ = emitir(self.salon_a)
        cuenta = publicador.publicar_pendientes(publicador.transporte_http(self.url, "s"))
        self.assertEqual(cuenta["reintentables"], 1)
        with tenancy.en_salon(self.salon_a):
            self.assertIn("500", EventoOutbox.objects.get(id=e.id).ultimo_error)

    def test_el_secreto_no_aparece_en_el_error_guardado(self):
        e, *_ = emitir(self.salon_a)
        publicador.publicar_pendientes(publicador.transporte_http("http://127.0.0.1:1/x", "SECRETO-123"))
        with tenancy.en_salon(self.salon_a):
            self.assertNotIn("SECRETO-123", EventoOutbox.objects.get(id=e.id).ultimo_error)

    def test_rechaza_urls_que_no_son_http(self):
        with self.assertRaises(ValueError):
            publicador.transporte_http("file:///etc/passwd", "s")


class ComandoTests(DosSalonesTestCase):
    @override_settings(N8N_WEBHOOK_URL="", N8N_WEBHOOK_SECRET="")
    def test_sin_configuracion_el_comando_se_niega(self):
        with self.assertRaises(CommandError):
            call_command("publicar_outbox", "--una-vez")
