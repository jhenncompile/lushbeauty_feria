from rest_framework import serializers

from apps.commissions.domain.comision import BASES


class VersionEntrada(serializers.Serializer):
    especialista_id = serializers.UUIDField(required=False, allow_null=True)
    porcentaje = serializers.DecimalField(max_digits=5, decimal_places=4, min_value=0, max_value=1)
    base = serializers.ChoiceField(choices=BASES)
    vigente_desde = serializers.DateField()
    motivo = serializers.CharField(max_length=250)


def regla_salida(r) -> dict:
    return {
        "id": str(r.id), "especialista_id": str(r.especialista_id) if r.especialista_id else None,
        "porcentaje": str(r.porcentaje), "base": r.base, "vigente_desde": r.vigente_desde.isoformat(),
        "vigente_hasta": r.vigente_hasta.isoformat() if r.vigente_hasta else None, "motivo": r.motivo,
    }
