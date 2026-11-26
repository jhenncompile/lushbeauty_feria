from __future__ import annotations

from apps.catalog.domain.validacion import validar_monto_no_negativo, validar_nombre
from apps.catalog.persistence.models import Cliente, Especialista, Servicio
from shared import tenancy


def crear_servicio(*, categoria: str, nombre: str, precio_lista, costo_materiales=None) -> Servicio:
    return Servicio.objects.create(
        salon_id=tenancy.salon_actual(),
        categoria=validar_nombre(categoria, "La categoría"),
        nombre=validar_nombre(nombre),
        precio_lista=validar_monto_no_negativo(precio_lista, "El precio de lista"),
        costo_materiales=None if costo_materiales is None
        else validar_monto_no_negativo(costo_materiales, "El costo de materiales"),
    )


def actualizar_servicio(servicio_id, **cambios) -> Servicio | None:
    servicio = Servicio.objects.filter(id=servicio_id).first()
    if servicio is None:
        return None
    if "precio_lista" in cambios:
        servicio.precio_lista = validar_monto_no_negativo(cambios["precio_lista"], "El precio de lista")
    if "activo" in cambios:
        servicio.activo = bool(cambios["activo"])
    servicio.save()  # el trigger de auditoría deja antes/después
    return servicio


def crear_especialista(*, nombre: str, sueldo_fijo=0, usuario_id=None) -> Especialista:
    return Especialista.objects.create(
        salon_id=tenancy.salon_actual(), nombre=validar_nombre(nombre), usuario_id=usuario_id,
        sueldo_fijo=validar_monto_no_negativo(sueldo_fijo, "El sueldo fijo"),
    )


def crear_cliente(*, nombre: str, telefono=None, notas=None) -> Cliente:
    return Cliente.objects.create(
        salon_id=tenancy.salon_actual(), nombre=validar_nombre(nombre), telefono=telefono, notas=notas
    )
