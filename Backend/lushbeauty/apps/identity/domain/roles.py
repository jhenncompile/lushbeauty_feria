"""Roles y permisos del sistema. Reglas puras: sin Django, sin base de datos."""

ADMINISTRADORA = "ADMINISTRADORA"
ESPECIALISTA = "ESPECIALISTA"
LECTOR = "LECTOR"

ROLES: dict[str, str] = {
    ADMINISTRADORA: "Administradora",
    ESPECIALISTA: "Especialista",
    LECTOR: "Lector de reportes",
}

# código -> (módulo, descripción)
PERMISOS: dict[str, tuple[str, str]] = {
    "ADMIN_USUARIOS": ("identity", "Gestionar usuarios y roles del salón"),
    "CATALOGO_GESTIONAR": ("catalog", "Editar servicios, precios y políticas"),
    "VENTA_REGISTRAR": ("sales", "Registrar ventas y pagos"),
    "LIQUIDACION_VER_PROPIA": ("payroll", "Ver la propia liquidación"),
    "LIQUIDACION_APROBAR": ("payroll", "Aprobar una liquidación semanal"),
    "CAJA_CERRAR": ("cashier", "Aprobar el cierre de caja"),
    "DECISION_APROBAR": ("recommendations", "Aprobar una decisión del DSS"),
    "REPORTES_VER": ("analytics", "Ver reportes agregados"),
    "DESCUENTO_APROBAR": ("sales", "Aprobar descuentos sobre el umbral"),
    "VENTA_ANULAR": ("sales", "Anular una venta con ajuste auditado"),
}

PERMISOS_POR_ROL: dict[str, frozenset[str]] = {
    ADMINISTRADORA: frozenset(PERMISOS),
    ESPECIALISTA: frozenset({"VENTA_REGISTRAR", "LIQUIDACION_VER_PROPIA"}),
    LECTOR: frozenset({"REPORTES_VER"}),
}


def permisos_de_roles(codigos_rol) -> frozenset[str]:
    permisos: set[str] = set()
    for codigo in codigos_rol:
        permisos |= PERMISOS_POR_ROL.get(codigo, frozenset())
    return frozenset(permisos)
