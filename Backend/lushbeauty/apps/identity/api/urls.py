from django.urls import path

from apps.identity.api import views

urlpatterns = [
    path("auth/login", views.LoginView.as_view()),
    path("auth/me", views.MeView.as_view()),
    path("identity/usuarios", views.UsuariosView.as_view()),
    path("identity/usuarios/<uuid:usuario_id>", views.UsuarioDetalleView.as_view()),
]
