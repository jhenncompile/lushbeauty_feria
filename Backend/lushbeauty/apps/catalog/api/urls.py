from django.urls import path

from apps.catalog.api import views

urlpatterns = [
    path("servicios/", views.ServiciosView.as_view()),
    path("servicios/<uuid:servicio_id>/", views.ServicioDetalleView.as_view()),
    path("especialistas/", views.EspecialistasView.as_view()),
    path("clientes/", views.ClientesView.as_view()),
]
