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


def nombres_de_usuarios(ids) -> dict:
    """{usuario_id: nombre} para los usuarios del salón activo."""
    return dict(Usuario.objects.filter(id__in=set(ids)).values_list("id", "nombre"))


def dia_corte_del_salon() -> int:
    """Último día de la semana de liquidación del salón activo (0 = lunes … 6 = domingo)."""
    return Salon.objects.values_list("dia_corte_semana", flat=True).get()


def salon_existe(salon_id) -> bool:
    """Con el salón ya activo en el contexto (la RLS oculta los demás)."""
    return Salon.objects.filter(id=salon_id).exists()


def usuario_id_por_email(email: str):
    return Usuario.objects.filter(email=email.strip().lower()).values_list("id", flat=True).first()
