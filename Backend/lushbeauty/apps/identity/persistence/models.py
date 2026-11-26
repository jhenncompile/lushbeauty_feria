import uuid
from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from shared.tenancy import SalonScopedManager


class Salon(models.Model):
    """Negocio (inquilino)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=120)
    moneda = models.CharField(max_length=3, default="BOB")
    descuento_maximo = models.DecimalField(
        max_digits=5, decimal_places=4, default=Decimal("0.50"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("1"))],
    )

    objects = SalonScopedManager(campo="id")

    class Meta:
        db_table = "salon"


class Rol(models.Model):
    """Catálogo global de roles (no pertenece a ningún salón)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=60)
    descripcion = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "rol"


class Permiso(models.Model):
    """Catálogo global de operaciones autorizables."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=60, unique=True)
    modulo = models.CharField(max_length=40)
    descripcion = models.CharField(max_length=200)

    class Meta:
        db_table = "permiso"


class RolPermiso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column="rol_id")
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column="permiso_id")

    class Meta:
        db_table = "rol_permiso"
        constraints = [models.UniqueConstraint(fields=["rol", "permiso"], name="uq_rol_permiso_01")]


class Usuario(models.Model):
    """Cuenta de acceso. Sus permisos provienen de sus roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    nombre = models.CharField(max_length=120)
    email = models.CharField(max_length=160)
    password_hash = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    objects = SalonScopedManager()

    # Contrato mínimo que DRF espera de `request.user`.
    is_authenticated = True
    is_anonymous = False

    class Meta:
        db_table = "usuario"
        constraints = [models.UniqueConstraint(fields=["salon_id", "email"], name="uq_usuario_01")]


class UsuarioRol(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon_id = models.UUIDField()
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column="usuario_id")
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column="rol_id")
    asignado_por = models.UUIDField(null=True, blank=True)

    objects = SalonScopedManager()

    class Meta:
        db_table = "usuario_rol"
        constraints = [models.UniqueConstraint(fields=["usuario", "rol"], name="uq_usuario_rol_01")]
