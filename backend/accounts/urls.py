from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CompanyListPublicView, CompanyTokenObtainPairView, MeView, RegisterView, UserManagementViewSet

router = DefaultRouter()
router.register("users", UserManagementViewSet, basename="users")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", CompanyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("companies/", CompanyListPublicView.as_view(), name="company_list_public"),
    path("me/", MeView.as_view(), name="me"),
] + router.urls
