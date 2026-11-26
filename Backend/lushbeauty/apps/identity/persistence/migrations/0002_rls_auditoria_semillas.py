from django.db import migrations

from apps.audit.contracts import sql_activar_auditoria
from apps.identity.domain.roles import PERMISOS, PERMISOS_POR_ROL, ROLES
from shared.tenancy import sql_aislamiento

TABLAS_POR_SALON = ["usuario", "usuario_rol"]

# El inicio de sesión busca por correo antes de conocer el salón. Esta política
# permite leer solo las filas con el correo que la sesión declara en `app.login_email`.
POLITICA_LOGIN = """
    CREATE POLICY acceso_login ON usuario FOR SELECT
        USING (email = nullif(current_setting('app.login_email', true), ''));
"""


def _sql():
    adelante, atras = [], []
    adelante.append(sql_aislamiento("salon", columna="id")[0])
    atras.append(sql_aislamiento("salon", columna="id")[1])
    for tabla in TABLAS_POR_SALON:
        a, b = sql_aislamiento(tabla)
        adelante.append(a)
        atras.append(b)
    adelante.append(POLITICA_LOGIN)
    atras.append("DROP POLICY IF EXISTS acceso_login ON usuario;")
    for tabla in ["salon", *TABLAS_POR_SALON]:
        a, b = sql_activar_auditoria(tabla)
        adelante.append(a)
        atras.append(b)
    return "\n".join(adelante), "\n".join(reversed(atras))


def sembrar(apps, schema_editor):
    Rol = apps.get_model("identity", "Rol")
    Permiso = apps.get_model("identity", "Permiso")
    RolPermiso = apps.get_model("identity", "RolPermiso")
    permisos = {
        codigo: Permiso.objects.create(codigo=codigo, modulo=modulo, descripcion=desc)
        for codigo, (modulo, desc) in PERMISOS.items()
    }
    for codigo, nombre in ROLES.items():
        rol = Rol.objects.create(codigo=codigo, nombre=nombre)
        for p in PERMISOS_POR_ROL[codigo]:
            RolPermiso.objects.create(rol=rol, permiso=permisos[p])


def desembrar(apps, schema_editor):
    for modelo in ("RolPermiso", "Rol", "Permiso"):
        apps.get_model("identity", modelo).objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("audit", "0001_initial"),
    ]
    operations = [
        migrations.RunSQL(*_sql()),
        migrations.RunPython(sembrar, desembrar),
    ]
