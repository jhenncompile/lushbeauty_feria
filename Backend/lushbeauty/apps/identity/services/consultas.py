from decimal import Decimal

from apps.identity.persistence.models import Salon, Usuario


def listar_usuarios():
    """Usuarios del salón activo (el manager y RLS acotan al salón)."""
    return Usuario.objects.order_by("nombre")


def obtener_usuario(usuario_id):
    return Usuario.objects.filter(id=usuario_id).first()


def descuento_maximo_del_salon() -> Decimal:
    """Tope de descuento (fracción 0..1) del salón activo."""
    return Salon.objects.values_list("descuento_maximo", flat=True).get()
