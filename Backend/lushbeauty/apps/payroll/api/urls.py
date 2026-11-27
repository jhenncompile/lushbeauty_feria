from django.urls import path

from apps.payroll.api import views

urlpatterns = [
    path("nomina/deducciones/", views.DeduccionesView.as_view()),
    path("nomina/liquidaciones/", views.LiquidacionesView.as_view()),
    path("nomina/liquidaciones/generar/", views.GenerarView.as_view()),
    path("nomina/liquidaciones/<uuid:liquidacion_id>/", views.LiquidacionDetalleView.as_view()),
]
