"""Interfaz pública de `catalog`. `sales` y otros módulos leen el catálogo solo por aquí."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from apps.catalog.persistence.models import Cliente, Especialista, Servicio
from apps.catalog.services import gestion


@dataclass(frozen=True)
class ServicioDTO:
    id: UUID
    nombre: str
    precio_lista: Decimal
    costo_materiales: Decimal | None
    activo: bool


def obtener_servicio(servicio_id) -> ServicioDTO | None:
    s = Servicio.objects.filter(id=servicio_id).first()
    return None if s is None else ServicioDTO(s.id, s.nombre, s.precio_lista, s.costo_materiales, s.activo)


def especialista_activa_existe(especialista_id) -> bool:
    return Especialista.objects.filter(id=especialista_id, activo=True).exists()


def especialista_de_usuario(usuario_id) -> UUID | None:
    return Especialista.objects.filter(usuario_id=usuario_id).values_list("id", flat=True).first()


def cliente_existe(cliente_id) -> bool:
    return Cliente.objects.filter(id=cliente_id).exists()


@dataclass(frozen=True)
class EspecialistaDTO:
    id: UUID
    nombre: str
    sueldo_fijo: Decimal
    activo: bool


def obtener_especialista(especialista_id) -> EspecialistaDTO | None:
    e = Especialista.objects.filter(id=especialista_id).first()
    return None if e is None else EspecialistaDTO(e.id, e.nombre, e.sueldo_fijo, e.activo)


def nombres_de_servicios(ids) -> dict:
    """{servicio_id: nombre} del salón activo."""
    return dict(Servicio.objects.filter(id__in=set(ids)).values_list("id", "nombre"))


def nombres_de_especialistas(ids) -> dict:
    """{especialista_id: nombre} del salón activo."""
    return dict(Especialista.objects.filter(id__in=set(ids)).values_list("id", "nombre"))


def listar_servicios():
    return list(Servicio.objects.order_by("categoria", "nombre"))


def listar_especialistas():
    return list(Especialista.objects.order_by("nombre"))


def listar_clientes():
    return list(Cliente.objects.order_by("nombre"))


crear_servicio = gestion.crear_servicio
crear_especialista = gestion.crear_especialista
crear_cliente = gestion.crear_cliente
