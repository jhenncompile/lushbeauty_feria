from rest_framework import serializers


class RangoEntrada(serializers.Serializer):
    desde = serializers.DateField()
    hasta = serializers.DateField()
    especialista_id = serializers.UUIDField(required=False)


def _totales(t) -> dict:
    return {"servicios": t.servicios, "bruto": str(t.bruto), "descuentos": str(t.descuentos),
            "cobrado": str(t.cobrado), "comisiones": str(t.comisiones), "propinas": str(t.propinas)}


def panel_salida(panel, nombres) -> dict:
    return {
        "hay_datos": panel.hay_datos, "ventas": panel.ventas, **_totales(panel.totales),
        "descuento_pct": None if panel.descuento_pct is None else str(panel.descuento_pct),
        "por_metodo": None if panel.por_metodo is None else {m: str(x) for m, x in panel.por_metodo.items()},
        "por_dia": [{"dia": d.isoformat(), "cobrado": str(x)} for d, x in panel.por_dia.items()],
        "por_especialista": [
            {"especialista_id": str(e), "nombre": nombres.get(e), **_totales(t)}
            for e, t in sorted(panel.por_especialista.items(), key=lambda kv: -kv[1].cobrado)
        ],
    }
