from apps.audit.persistence.models import Auditoria
from shared import tenancy


def registrar_evento(accion: str, entidad: str, *, entidad_id=None, valor_nuevo=None,
                     valor_anterior=None, direccion_ip: str | None = None) -> None:
    """Escribe una entrada de bitácora para el salón y usuario activos."""
    salon = tenancy.salon_actual()
    if salon is None:
        return
    Auditoria.objects.create(
        salon_id=salon, usuario_id=tenancy.usuario_actual(), accion=accion, entidad=entidad,
        entidad_id=entidad_id, valor_anterior=valor_anterior, valor_nuevo=valor_nuevo,
        direccion_ip=direccion_ip,
    )


def registrar_acceso_denegado(*, permiso: str, ruta: str, metodo: str,
                              direccion_ip: str | None = None) -> None:
    registrar_evento(
        Auditoria.Accion.ACCESO_DENEGADO, "endpoint",
        valor_nuevo={"permiso": permiso, "ruta": ruta, "metodo": metodo}, direccion_ip=direccion_ip,
    )
