"""Publicador del outbox: proceso sin petición. Toma lotes por salón y los entrega con un transporte inyectable."""

from __future__ import annotations

import time
import urllib.request
from collections.abc import Callable

from django.db import connection, transaction
from django.utils import timezone

from apps.notifications.domain import outbox as dominio
from apps.notifications.persistence.models import EventoOutbox
from apps.notifications.services.outbox import EventoDTO, a_dto
from shared import tenancy

Transporte = Callable[[EventoDTO], None]  # lanza una excepción si el envío falla


def _salones_con_pendientes() -> list:
    """Solo lectura sin salón: la política `lectura_publicador` lo permite mientras `app.publicador = 'on'`."""
    with connection.cursor() as c:
        c.execute("SELECT set_config('app.publicador', 'on', false)")
        try:
            c.execute("SELECT DISTINCT salon_id FROM evento_outbox WHERE estado = 'PENDIENTE'")
            return [fila[0] for fila in c.fetchall()]
        finally:
            c.execute("SELECT set_config('app.publicador', '', false)")


def publicar_pendientes(enviar: Transporte, *, lote: int = 50, max_intentos: int = 5) -> dict[str, int]:
    """Procesa los eventos pendientes de todos los salones. Devuelve {'enviados', 'fallidos', 'reintentables'}.

    Cada salón se procesa con su `app.salon_id` (RLS). `SKIP LOCKED` evita que dos publicadores tomen el mismo evento.
    Un fallo no detiene al resto del lote: queda registrado y se reintenta en la siguiente corrida hasta `max_intentos`.
    """
    cuenta = {"enviados": 0, "fallidos": 0, "reintentables": 0}
    for salon_id in _salones_con_pendientes():
        with tenancy.en_salon(salon_id):
            with transaction.atomic():
                tomados = list(EventoOutbox.objects.select_for_update(skip_locked=True)
                               .filter(estado=EventoOutbox.Estado.PENDIENTE).order_by("creado_en")[:lote])
                for evento in tomados:
                    try:
                        enviar(a_dto(evento))
                        error = None
                    except Exception as exc:  # el transporte decide qué puede fallar
                        error = dominio.recortar_error(f"{type(exc).__name__}: {exc}")
                    nuevo = dominio.estado_tras_intento(evento.intentos, error is None, max_intentos)
                    evento.estado, evento.intentos, evento.ultimo_error = nuevo, evento.intentos + 1, error
                    evento.enviado_en = timezone.now() if error is None else None
                    evento.save(update_fields=["estado", "intentos", "ultimo_error", "enviado_en"])
                    cuenta["enviados" if nuevo == dominio.ENVIADO else
                           "fallidos" if nuevo == dominio.FALLIDO else "reintentables"] += 1
    return cuenta


def transporte_http(url: str, secreto: str, *, timeout: float = 10.0) -> Transporte:
    """POST firmado al webhook (n8n). Cabeceras: X-Lush-Event-Id (para deduplicar), X-Lush-Timestamp y X-Lush-Signature."""
    if not url.startswith(("https://", "http://")):
        raise ValueError("La URL del webhook debe empezar con http:// o https://.")

    def enviar(evento: EventoDTO) -> None:
        cuerpo = dominio.cuerpo(evento.id, evento.tipo, evento.entidad_id, evento.payload)
        marca = int(time.time())
        pedido = urllib.request.Request(url, data=cuerpo, method="POST", headers={
            "Content-Type": "application/json", "X-Lush-Event-Id": str(evento.id),
            "X-Lush-Timestamp": str(marca), "X-Lush-Signature": dominio.firmar(secreto, marca, cuerpo)})
        with urllib.request.urlopen(pedido, timeout=timeout) as respuesta:  # noqa: S310 (esquema validado arriba)
            if not 200 <= respuesta.status < 300:
                raise RuntimeError(f"El webhook respondió {respuesta.status}.")

    return enviar
