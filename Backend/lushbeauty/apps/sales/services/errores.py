class VentaRechazada(Exception):
    """Error de negocio al registrar o anular. `estado` es el código HTTP sugerido."""

    def __init__(self, codigo: str, mensaje: str, estado: int = 422):
        super().__init__(mensaje)
        self.codigo, self.mensaje, self.estado = codigo, mensaje, estado
