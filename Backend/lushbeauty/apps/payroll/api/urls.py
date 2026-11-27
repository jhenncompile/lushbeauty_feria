from django.urls import path

from apps.payroll.api import views

urlpatterns = [
    path("nomina/deducciones/", views.DeduccionesView.as_view()),
    path("nomina/mis-liquidaciones/", views.MisLiquidacionesView.as_view()),
    path("nomina/mis-liquidaciones/<uuid:liquidacion_id>/", views.MiLiquidacionDetalleView.as_view()),
    path("nomina/liquidaciones/", views.LiquidacionesView.as_view()),
    path("nomina/liquidaciones/generar/", views.GenerarView.as_view()),
    path("nomina/liquidaciones/<uuid:liquidacion_id>/", views.LiquidacionDetalleView.as_view()),
    path("nomina/liquidaciones/<uuid:liquidacion_id>/aprobar/", views.AprobarView.as_view()),
    path("nomina/liquidaciones/<uuid:liquidacion_id>/pagar/", views.PagarView.as_view()),
]
