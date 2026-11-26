"""Interfaz pública del módulo `audit`. Otros módulos solo importan de aquí."""

from apps.audit.persistence.sql import sql_activar_auditoria
from apps.audit.services.consulta import EntradaHistorial, historial
from apps.audit.services.registro import registrar_acceso_denegado, registrar_evento

__all__ = ["registrar_evento", "registrar_acceso_denegado", "sql_activar_auditoria",
           "EntradaHistorial", "historial"]
