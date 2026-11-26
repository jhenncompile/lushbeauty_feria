from rest_framework import serializers

_DINERO = {"max_digits": 12, "decimal_places": 2}


class ServicioEntrada(serializers.Serializer):
    categoria = serializers.CharField(max_length=60)
    nombre = serializers.CharField(max_length=120)
    precio_lista = serializers.DecimalField(**_DINERO)
    costo_materiales = serializers.DecimalField(**_DINERO, required=False, allow_null=True)


class ServicioCambio(serializers.Serializer):
    precio_lista = serializers.DecimalField(**_DINERO, required=False)
    activo = serializers.BooleanField(required=False)


class EspecialistaEntrada(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    sueldo_fijo = serializers.DecimalField(**_DINERO, required=False, default=0)
    usuario_id = serializers.UUIDField(required=False, allow_null=True)


class ClienteEntrada(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    telefono = serializers.CharField(max_length=30, required=False, allow_null=True, allow_blank=True)
    notas = serializers.CharField(required=False, allow_null=True, allow_blank=True)


def servicio_salida(s, *, gestor: bool) -> dict:
    datos = {"id": str(s.id), "categoria": s.categoria, "nombre": s.nombre,
             "precio_lista": str(s.precio_lista), "activo": s.activo}
    if gestor:  # el costo de materiales es sensible: solo quien gestiona el catálogo
        datos["costo_materiales"] = None if s.costo_materiales is None else str(s.costo_materiales)
    return datos


def especialista_salida(e, *, gestor: bool) -> dict:
    datos = {"id": str(e.id), "nombre": e.nombre, "activo": e.activo}
    if gestor:  # el sueldo fijo es sensible
        datos["sueldo_fijo"] = str(e.sueldo_fijo)
        datos["usuario_id"] = None if e.usuario_id is None else str(e.usuario_id)
    return datos


def cliente_salida(c) -> dict:
    return {"id": str(c.id), "nombre": c.nombre, "telefono": c.telefono, "notas": c.notas}
