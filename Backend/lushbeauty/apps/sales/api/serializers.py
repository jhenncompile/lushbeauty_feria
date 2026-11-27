from rest_framework import serializers

from apps.sales.domain.calculo import METODOS_PAGO

_DINERO = {"max_digits": 12, "decimal_places": 2}


class LineaSerializer(serializers.Serializer):
    servicio_id = serializers.UUIDField()
    especialista_id = serializers.UUIDField()
    cantidad = serializers.IntegerField(min_value=1, default=1)
    descuento = serializers.DecimalField(**_DINERO, min_value=0, default=0)
    motivo_descuento = serializers.CharField(max_length=200, required=False, allow_null=True, allow_blank=True)
    propina = serializers.DecimalField(**_DINERO, min_value=0, default=0)
    metodo_propina = serializers.ChoiceField(choices=METODOS_PAGO, required=False, allow_null=True)


class PagoSerializer(serializers.Serializer):
    metodo = serializers.ChoiceField(choices=METODOS_PAGO)
    monto = serializers.DecimalField(**_DINERO)


class VentaEntrada(serializers.Serializer):
    uuid_cliente = serializers.UUIDField()
    cliente_id = serializers.UUIDField(required=False, allow_null=True)
    fecha_servicio = serializers.DateTimeField(required=False, allow_null=True)
    lineas = LineaSerializer(many=True, allow_empty=False)
    pagos = PagoSerializer(many=True, allow_empty=False)


class AnulacionEntrada(serializers.Serializer):
    motivo = serializers.CharField(max_length=250)


def venta_salida(v) -> dict:
    lineas = [{
        "id": str(l.id), "servicio_id": str(l.servicio_id), "especialista_id": str(l.especialista_id),
        "cantidad": l.cantidad, "precio_lista": str(l.precio_lista), "descuento": str(l.descuento),
        "motivo_descuento": l.motivo_descuento, "importe_cobrado": str(l.importe_cobrado),
        "propina": str(l.propina), "metodo_propina": l.metodo_propina,
        "comision": None if l.comision is None else str(l.comision),
        "tasa_comision": None if l.tasa_comision is None else str(l.tasa_comision),
        "base_comision": l.base_comision,
    } for l in v.lineas.all()]
    pagos = [{"metodo": p.metodo, "monto": str(p.monto)} for p in v.pagos.all()]
    return {
        "id": str(v.id), "uuid_cliente": str(v.uuid_cliente), "cliente_id": str(v.cliente_id) if v.cliente_id else None,
        "estado": v.estado, "origen": v.origen, "fecha_servicio": v.fecha_servicio.isoformat(),
        "motivo_anulacion": v.motivo_anulacion,
        "total": str(sum((l.importe_cobrado for l in v.lineas.all()), 0)),
        "lineas": lineas, "pagos": pagos,
    }
