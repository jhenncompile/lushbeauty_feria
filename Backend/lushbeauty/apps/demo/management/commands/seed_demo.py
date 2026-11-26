from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.demo.seed import CLAVE_DEMO, SALONES_DEMO, sembrar


class Command(BaseCommand):
    help = "Carga datos sintéticos de desarrollo (salones, usuarios por rol, catálogo, ventas). Idempotente."

    def handle(self, *args, **opciones):
        if not settings.DEBUG:
            raise CommandError("seed_demo solo corre con DJANGO_DEBUG=true: crea cuentas con una clave conocida.")
        nuevos = sembrar()
        self.stdout.write(self.style.SUCCESS("Datos de demostración listos: " + ", ".join(f"{k}={v}" for k, v in nuevos.items())))
        self.stdout.write(f"Clave de todas las cuentas: {CLAVE_DEMO}")
        for demo in SALONES_DEMO:
            for nombre, email, rol in demo.usuarios:
                self.stdout.write(f"  {email:<26} {rol:<15} {demo.nombre}")
