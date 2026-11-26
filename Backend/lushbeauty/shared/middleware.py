from shared import tenancy


class LimpiarContextoSalonMiddleware:
    """Garantiza que el salón activo de una petición no se filtre a la siguiente
    (las conexiones a la base de datos se reutilizan)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        finally:
            tenancy.limpiar()
