from django.urls import path

from .views import DashboardMetrics

urlpatterns = [
    path("dashboard/", DashboardMetrics.as_view(), name="metrics-dashboard"),
]
