from django.db import migrations

from apps.identity.domain.roles import PERMISOS, PERMISOS_POR_ROL


def sembrar(apps, schema_editor):
    """Idempotente: una base nueva ya trae estos permisos desde 0002."""
    Rol = apps.get_model("identity", "Rol")
    Permiso = apps.get_model("identity", "Permiso")
    RolPermiso = apps.get_model("identity", "RolPermiso")
    for codigo, (modulo, desc) in PERMISOS.items():
        Permiso.objects.get_or_create(codigo=codigo, defaults={"modulo": modulo, "descripcion": desc})
    for rol_codigo, permisos in PERMISOS_POR_ROL.items():
        rol = Rol.objects.get(codigo=rol_codigo)
        for p in permisos:
            RolPermiso.objects.get_or_create(rol=rol, permiso=Permiso.objects.get(codigo=p))


class Migration(migrations.Migration):
    dependencies = [("identity", "0002_rls_auditoria_semillas")]
    operations = [migrations.RunPython(sembrar, migrations.RunPython.noop)]
