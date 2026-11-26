from django.db import migrations

from apps.audit.contracts import sql_activar_auditoria
from shared.tenancy import sql_aislamiento

TABLAS = ["servicio", "cliente", "especialista"]


def _sql():
    adelante, atras = [], []
    for tabla in TABLAS:
        for par in (sql_aislamiento(tabla), sql_activar_auditoria(tabla)):
            adelante.append(par[0])
            atras.append(par[1])
    return "\n".join(adelante), "\n".join(reversed(atras))


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial"), ("audit", "0001_initial")]
    operations = [migrations.RunSQL(*_sql())]
