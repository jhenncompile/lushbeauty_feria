import uuid

import django.utils.timezone
from django.db import migrations, models

from apps.audit.persistence import sql
from shared.tenancy import sql_aislamiento

_rls_adelante, _rls_atras = sql_aislamiento("auditoria")


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Auditoria",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("salon_id", models.UUIDField()),
                ("usuario_id", models.UUIDField(blank=True, null=True)),
                ("permiso_id", models.UUIDField(blank=True, null=True)),
                ("accion", models.CharField(choices=[
                    ("CREAR", "Crear"), ("MODIFICAR", "Modificar"), ("ELIMINAR", "Eliminar"),
                    ("APROBAR", "Aprobar"), ("INICIAR_SESION", "Iniciar Sesion"),
                    ("ACCESO_DENEGADO", "Acceso Denegado"), ("CONSULTAR", "Consultar"),
                    ("EXPORTAR", "Exportar")], max_length=20)),
                ("entidad", models.CharField(max_length=60)),
                ("entidad_id", models.UUIDField(blank=True, null=True)),
                ("valor_anterior", models.JSONField(blank=True, null=True)),
                ("valor_nuevo", models.JSONField(blank=True, null=True)),
                ("direccion_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("ocurrido_en", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={"db_table": "auditoria", "ordering": ["-ocurrido_en"]},
        ),
        migrations.RunSQL(sql.FN_SOLO_INSERCION, "DROP FUNCTION fn_solo_insercion();"),
        migrations.RunSQL(
            sql.SOLO_INSERCION_TRIGGERS,
            "DROP TRIGGER tg_auditoria_truncate ON auditoria; "
            "DROP TRIGGER tg_auditoria_solo_insercion ON auditoria;",
        ),
        migrations.RunSQL(sql.FN_AUDITAR, "DROP FUNCTION fn_auditar();"),
        migrations.RunSQL(_rls_adelante, _rls_atras),
    ]
