from rest_framework import serializers

from apps.payroll.domain.nomina import TIPOS_DEDUCCION

_DINERO = {"max_digits": 12, "decimal_places": 2}


class DeduccionEntrada(serializers.Serializer):
    especialista_id = serializers.UUIDField()
    tipo = serializers.ChoiceField(choices=TIPOS_DEDUCCION)
    monto = serializers.DecimalField(**_DINERO)
    motivo = serializers.CharField(max_length=250)
    fecha = serializers.DateField()


class GenerarEntrada(serializers.Serializer):
    especialista_id = serializers.UUIDField()
    fecha = serializers.DateField()


class PagoEntrada(serializers.Serializer):
    comprobante_url = serializers.URLField(max_length=300, required=False, allow_blank=True, allow_null=True)


class FiltroPeriodo(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)


class FiltroListado(serializers.Serializer):
    especialista_id = serializers.UUIDField(required=False)
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)


def movimiento_salida(m) -> dict:
    return {"id": str(m.id), "tipo": m.tipo, "monto": str(m.monto), "motivo": m.motivo, "fecha": m.fecha.isoformat(),
            "especialista_id": str(m.especialista_id), "ajuste_de_linea_id": str(m.ajuste_de_linea_id) if m.ajuste_de_linea_id else None}


def liquidacion_salida(l) -> dict:
    return {
        "id": str(l.id), "especialista_id": str(l.especialista_id), "estado": l.estado,
        "periodo_inicio": l.periodo_inicio.isoformat(), "periodo_fin": l.periodo_fin.isoformat(),
        "sueldo_fijo": str(l.sueldo_fijo), "total_comision": str(l.total_comision), "total_propina": str(l.total_propina),
        "total_movimientos": str(l.total_movimientos), "neto": str(l.neto), "excedente": str(l.excedente),
        "aprobada_en": l.aprobada_en.isoformat() if l.aprobada_en else None, "comprobante_url": l.comprobante_url,
    }


def detalle_salida(d) -> dict:
    return {
        **liquidacion_salida(d.liquidacion),
        "lineas": [{"linea_id": str(x.linea_id), "venta_id": str(x.venta_id), "dia": x.dia.isoformat(),
                    "servicio_id": str(x.servicio_id), "importe_cobrado": str(x.importe_cobrado),
                    "comision": None if x.comision is None else str(x.comision), "propina": str(x.propina)}
                   for x in d.lineas],
        "movimientos": [movimiento_salida(m) for m in d.movimientos],
        "lineas_sin_comision": d.lineas_sin_comision,
    }
