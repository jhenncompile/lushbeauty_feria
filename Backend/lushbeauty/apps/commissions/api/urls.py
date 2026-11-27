from django.urls import path

from apps.commissions.api import views

urlpatterns = [path("comisiones/reglas/", views.ReglasView.as_view())]
