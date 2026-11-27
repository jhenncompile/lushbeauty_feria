import uuid

import django.db.models.deletion  # noqa: F401
from django.db import migrations, models
from django.db.models import F, Q

from apps.audit.contracts import sql_activar_auditoria
from apps.commissions.persistence import sql
from shared.tenancy import sql_aislamiento

_rls = sql_aislamiento("regla_comision")
_aud = sql_activar_auditoria("regla_comision")


class Migration(migrations.Migration):
    initial = True
    dependencies = [("audit", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="ReglaComision",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("salon_id", models.UUIDField()),
                ("especialista_id", models.UUIDField(blank=True, null=True)),
                ("porcentaje", models.DecimalField(decimal_places=4, max_digits=5)),
                ("base", models.CharField(choices=[("PRECIO_LISTA", "Precio Lista"), ("PRECIO_COBRADO", "Precio Cobrado")], max_length=20)),
                ("vigente_desde", models.DateField()),
                ("vigente_hasta", models.DateField(blank=True, null=True)),
                ("motivo", models.CharField(max_length=250)),
                ("creada_por", models.UUIDField(blank=True, null=True)),
            ],
            options={"db_table": "regla_comision"},
        ),
        migrations.AddConstraint("reglacomision", models.CheckConstraint(
            condition=Q(porcentaje__gte=0) & Q(porcentaje__lte=1), name="ck_regla_comision_01")),
        migrations.AddConstraint("reglacomision", models.CheckConstraint(
            condition=Q(vigente_hasta__isnull=True) | Q(vigente_hasta__gte=F("vigente_desde")),
            name="ck_regla_comision_02")),
        migrations.RunSQL(sql.EXT_BTREE_GIST, migrations.RunSQL.noop),
        migrations.RunSQL(sql.EXCLUIR_SOLAPE, sql.EXCLUIR_SOLAPE_ATRAS),
        migrations.RunSQL(sql.FN_REGLA_INMUTABLE, sql.FN_REGLA_INMUTABLE_ATRAS),
        migrations.RunSQL(*_rls),
        migrations.RunSQL(*_aud),
    ]
