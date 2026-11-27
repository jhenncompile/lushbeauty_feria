from rest_framework import serializers

from apps.cashier.domain.caja import METODOS, diferencia, estado_de

_DINERO = {"max_digits": 12, "decimal_places": 2}


class DeclaracionEntrada(serializers.Serializer):
    metodo = serializers.ChoiceField(choices=METODOS)
    declarado = serializers.DecimalField(**_DINERO)
    justificacion = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class CierreEntrada(serializers.Serializer):
    fecha = serializers.DateField()
    declaraciones = DeclaracionEntrada(many=True, allow_empty=False)


class RangoEntrada(serializers.Serializer):
    desde = serializers.DateField()
    hasta = serializers.DateField()


class FiltroOpcional(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)


def cierre_salida(c) -> dict:
    dif = diferencia(c.declarado, c.esperado)
    return {
        "id": str(c.id), "fecha": c.fecha.isoformat(), "metodo": c.metodo, "esperado": str(c.esperado),
        "declarado": str(c.declarado), "diferencia": str(dif), "estado": estado_de(dif),
        "justificacion": c.justificacion, "aprobado": c.aprobado_por is not None,
        "aprobado_en": c.aprobado_en.isoformat() if c.aprobado_en else None,
    }


def resumen_salida(r) -> dict:
    return {"dia": r.dia.isoformat(), "por_metodo": {m: str(x) for m, x in r.por_metodo.items()},
            "total": str(r.total), "descuentos": str(r.descuentos)}
