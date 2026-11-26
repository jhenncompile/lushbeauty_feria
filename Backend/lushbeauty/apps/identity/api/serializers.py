from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


def usuario_publico(usuario, roles, permisos) -> dict:
    return {
        "id": str(usuario.id), "salon_id": str(usuario.salon_id), "nombre": usuario.nombre,
        "email": usuario.email, "roles": roles, "permisos": sorted(permisos),
    }
