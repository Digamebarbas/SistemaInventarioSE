from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from config.permissions import IsPlatformAdmin

from .models import Company
from .serializers import (
	CompanyTokenObtainPairSerializer,
	RegisterSerializer,
	UserManagementSerializer,
	UserSerializer,
)


class RegisterView(generics.CreateAPIView):
	permission_classes = [IsPlatformAdmin]
	serializer_class = RegisterSerializer


class CompanyTokenObtainPairView(TokenObtainPairView):
	serializer_class = CompanyTokenObtainPairSerializer


class CompanyListPublicView(APIView):
	permission_classes = [permissions.AllowAny]

	def get(self, request):
		companies = Company.objects.filter(is_active=True).values("id", "name", "slug").order_by("name")
		return Response(list(companies))


class MeView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		return Response(UserSerializer(request.user, context={"request": request}).data)


class UserManagementViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all().order_by("username")
	serializer_class = UserManagementSerializer
	permission_classes = [IsPlatformAdmin]

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		if instance.id == request.user.id:
			return Response({"detail": "No puedes eliminar tu propio usuario."}, status=status.HTTP_400_BAD_REQUEST)

		try:
			return super().destroy(request, *args, **kwargs)
		except Exception as exc:
			instance.is_active = False
			instance.save(update_fields=["is_active"])
			return Response(
				{
					"detail": "No se pudo eliminar físicamente el usuario. Se desactivó correctamente.",
					"error": str(exc),
				},
				status=status.HTTP_200_OK,
			)

	@action(detail=False, methods=["get"])
	def summary(self, request):
		return Response(
			{
				"total": User.objects.count(),
				"active": User.objects.filter(is_active=True).count(),
				"admins": User.objects.filter(groups__name="Admin").distinct().count(),
				"usuarios": User.objects.filter(groups__name="Usuario").distinct().count(),
			}
		)

# Create your views here.
