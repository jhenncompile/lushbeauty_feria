# Django descubre los modelos aquí; la definición vive en persistence/.
from apps.identity.persistence.models import (  # noqa: F401
    Permiso, Rol, RolPermiso, Salon, Usuario, UsuarioRol,
)
