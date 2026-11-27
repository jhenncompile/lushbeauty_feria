from django.urls import include, path

urlpatterns = [
    path("api/", include("apps.identity.api.urls")),
    path("api/v1/", include("apps.catalog.api.urls")),
    path("api/v1/", include("apps.commissions.api.urls")),
    path("api/v1/", include("apps.sales.api.urls")),
    path("api/v1/", include("apps.cashier.api.urls")),
]
