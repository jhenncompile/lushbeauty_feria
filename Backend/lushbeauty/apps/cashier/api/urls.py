from django.urls import path

from apps.cashier.api import views

urlpatterns = [
    path("caja/resumen/", views.ResumenView.as_view()),
    path("caja/cierres/", views.CierresView.as_view()),
    path("caja/cierres/<uuid:cierre_id>/aprobar/", views.AprobarCierreView.as_view()),
]
