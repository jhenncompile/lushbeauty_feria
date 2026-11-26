"""Configuración de Lush Beauty. Todo lo que cambia por entorno viene de variables
de entorno (ver `.env.example` en la raíz del repo); nada de infraestructura fija."""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def _bool(nombre: str, defecto: bool = False) -> bool:
    return os.environ.get(nombre, str(defecto)).strip().lower() in {"1", "true", "yes", "si"}


DEBUG = _bool("DJANGO_DEBUG", False)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("Define DJANGO_SECRET_KEY (o DJANGO_DEBUG=true en desarrollo).")
    SECRET_KEY = "solo-desarrollo-no-usar-en-produccion"

ALLOWED_HOSTS = [h for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h]
if DEBUG and not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "apps.audit",
    "apps.identity",
    "apps.catalog",
    "apps.sales",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "shared.middleware.LimpiarContextoSalonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# Las migraciones viven dentro de cada módulo (persistence/), no en la raíz de la app.
MIGRATION_MODULES = {
    "audit": "apps.audit.persistence.migrations",
    "identity": "apps.identity.persistence.migrations",
    "catalog": "apps.catalog.persistence.migrations",
    "sales": "apps.sales.persistence.migrations",
}

# PostgreSQL es obligatorio: el aislamiento por salón se apoya en RLS.
# El usuario de la app NO debe ser superusuario (los superusuarios saltan RLS).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "lushbeauty"),
        "USER": os.environ.get("POSTGRES_USER", "lushbeauty"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.identity.api.authentication.TokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

# Descuento (fracción del precio de lista de la línea) que una especialista puede aplicar sin
# aprobación. Valor ilustrativo del diseño; pendiente de la decisión 8 con la administradora.
VENTAS_UMBRAL_DESCUENTO_SIN_APROBACION = os.environ.get("VENTAS_UMBRAL_DESCUENTO", "0.10")

# Vigencia del token de sesión, en segundos.
AUTH_TOKEN_MAX_AGE = int(os.environ.get("AUTH_TOKEN_MAX_AGE", 8 * 3600))

LANGUAGE_CODE = "es"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
