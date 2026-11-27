"""Reglas del outbox: puras, sin Django ni red."""

from __future__ import annotations

import hashlib
import hmac
import json

PENDIENTE, ENVIADO, FALLIDO = "PENDIENTE", "ENVIADO", "FALLIDO"
MAX_ERROR = 500


def cuerpo(evento_id, tipo: str, entidad_id, payload: dict) -> bytes:
    """Cuerpo canónico (claves ordenadas, sin espacios): lo mismo en el envío y en la verificación."""
    return json.dumps({"event_id": str(evento_id), "tipo": tipo, "entidad_id": str(entidad_id), "payload": payload},
                      sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def firmar(secreto: str, marca_de_tiempo: int, cuerpo_bytes: bytes) -> str:
    """HMAC-SHA256 de `<marca>.<cuerpo>`. La marca evita reutilizar una firma vieja."""
    mensaje = str(marca_de_tiempo).encode() + b"." + cuerpo_bytes
    return "sha256=" + hmac.new(secreto.encode(), mensaje, hashlib.sha256).hexdigest()


def firma_valida(secreto: str, marca_de_tiempo: int, cuerpo_bytes: bytes, firma: str) -> bool:
    return hmac.compare_digest(firmar(secreto, marca_de_tiempo, cuerpo_bytes), firma)


def estado_tras_intento(intentos_previos: int, exito: bool, max_intentos: int) -> str:
    """Un envío exitoso cierra el evento; un fallo lo deja pendiente hasta agotar los intentos."""
    if exito:
        return ENVIADO
    return FALLIDO if intentos_previos + 1 >= max_intentos else PENDIENTE


def recortar_error(texto: str) -> str:
    return texto if len(texto) <= MAX_ERROR else texto[: MAX_ERROR - 1] + "…"
