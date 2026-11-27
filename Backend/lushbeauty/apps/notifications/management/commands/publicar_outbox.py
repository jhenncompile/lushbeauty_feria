import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.notifications.services import publicador


class Command(BaseCommand):
    help = "Publica los eventos pendientes del outbox al webhook de n8n (firmados con HMAC)."

    def add_arguments(self, parser):
        parser.add_argument("--una-vez", action="store_true", help="Procesa un lote y termina (por defecto repite).")
        parser.add_argument("--intervalo", type=int, default=15, help="Segundos entre corridas.")

    def handle(self, *args, **opciones):
        if not settings.N8N_WEBHOOK_URL or not settings.N8N_WEBHOOK_SECRET:
            raise CommandError("Define N8N_WEBHOOK_URL y N8N_WEBHOOK_SECRET en el entorno.")
        enviar = publicador.transporte_http(settings.N8N_WEBHOOK_URL, settings.N8N_WEBHOOK_SECRET)
        while True:
            cuenta = publicador.publicar_pendientes(enviar, max_intentos=settings.OUTBOX_MAX_INTENTOS)
            if any(cuenta.values()):
                self.stdout.write(str(cuenta))
            if opciones["una_vez"]:
                return
            time.sleep(opciones["intervalo"])
