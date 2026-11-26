from django.db import migrations

# Permiso fijo en la migración: no depende de cómo evolucione `domain/roles.py`.
CODIGO = "AUDITORIA_VER"


def sembrar(apps, schema_editor):
    """Idempotente: una base nueva ya lo trae desde 0002."""
    Rol = apps.get_model("identity", "Rol")
    Permiso = apps.get_model("identity", "Permiso")
    RolPermiso = apps.get_model("identity", "RolPermiso")
    permiso, _ = Permiso.objects.get_or_create(
        codigo=CODIGO, defaults={"modulo": "audit", "descripcion": "Consultar el historial de acciones por usuario"})
    RolPermiso.objects.get_or_create(rol=Rol.objects.get(codigo="ADMINISTRADORA"), permiso=permiso)


class Migration(migrations.Migration):
    dependencies = [("identity", "0003_permisos_ventas")]
    operations = [migrations.RunPython(sembrar, migrations.RunPython.noop)]
