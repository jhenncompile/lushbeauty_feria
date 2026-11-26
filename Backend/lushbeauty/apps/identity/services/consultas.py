from apps.identity.persistence.models import Usuario


def listar_usuarios():
    """Usuarios del salón activo (el manager y RLS acotan al salón)."""
    return Usuario.objects.order_by("nombre")


def obtener_usuario(usuario_id):
    return Usuario.objects.filter(id=usuario_id).first()
