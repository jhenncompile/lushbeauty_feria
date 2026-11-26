from django.db import migrations

from apps.audit.contracts import sql_activar_auditoria
from apps.sales.persistence import sql
from shared.tenancy import sql_aislamiento

TABLAS = ["venta", "linea_venta", "pago"]


def _sql_salon():
    adelante, atras = [], []
    for tabla in TABLAS:
        for par in (sql_aislamiento(tabla), sql_activar_auditoria(tabla)):
            adelante.append(par[0])
            atras.append(par[1])
    return "\n".join(adelante), "\n".join(reversed(atras))


class Migration(migrations.Migration):
    dependencies = [("sales", "0001_initial"), ("audit", "0001_initial")]
    operations = [
        migrations.RunSQL(*_sql_salon()),
        migrations.RunSQL(sql.FN_VALIDAR_VENTA, sql.FN_VALIDAR_VENTA_ATRAS),
        migrations.RunSQL(sql.FN_LINEA_INMUTABLE, sql.FN_LINEA_INMUTABLE_ATRAS),
        migrations.RunSQL(sql.FN_NO_BORRAR, sql.FN_NO_BORRAR_ATRAS),
    ]
