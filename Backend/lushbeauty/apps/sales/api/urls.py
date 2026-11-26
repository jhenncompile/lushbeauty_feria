from django.urls import path

from apps.sales.api import views

urlpatterns = [
    path("ventas/", views.VentasView.as_view()),
    path("ventas/<uuid:venta_id>/", views.VentaDetalleView.as_view()),
    path("ventas/<uuid:venta_id>/anular/", views.AnularVentaView.as_view()),
]
