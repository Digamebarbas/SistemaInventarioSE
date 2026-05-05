from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from config.permissions import IsPlatformAdmin

from .models import Company
from .serializers import (
	ChangePasswordSerializer,
	CompanyOnboardingCreateSerializer,
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


class CompanyOnboardingCreateView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		serializer = CompanyOnboardingCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		created_payload = serializer.save()
		return Response(created_payload, status=status.HTTP_201_CREATED)


class ChangePasswordView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		serializer = ChangePasswordSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		user = request.user
		if not user.check_password(serializer.validated_data["current_password"]):
			return Response(
				{"detail": "Contraseña actual incorrecta."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		user.set_password(serializer.validated_data["new_password"])
		user.save()
		
		# Clear must_change_password flag via raw SQL if column exists
		try:
			from django.db import connection
			with connection.cursor() as cursor:
				cursor.execute(
					"UPDATE auth_user SET must_change_password = 0 WHERE id = %s",
					[user.id]
				)
		except Exception:
			# Column might not exist in test DB, ignore
			pass

		return Response({"detail": "Contraseña actualizada correctamente."}, status=status.HTTP_200_OK)



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
