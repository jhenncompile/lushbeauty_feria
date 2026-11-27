from django.urls import path

from apps.analytics.api import views

urlpatterns = [path("analytics/panel/", views.PanelView.as_view())]
