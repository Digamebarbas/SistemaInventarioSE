from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.tenancy import get_request_company
from config.permissions import IsPlatformAdmin

from .models import Alert
from .serializers import AlertSerializer


class AlertViewSet(viewsets.ModelViewSet):
	queryset = Alert.objects.select_related("product")
	serializer_class = AlertSerializer
	permission_classes = [IsAuthenticated]
	http_method_names = ["get", "patch", "head", "options"]

	def get_queryset(self):
		company = get_request_company(self.request)
		if not company:
			return Alert.objects.none()
		return Alert.objects.select_related("product").filter(product__company=company)

	@action(detail=True, methods=["patch"])
	def resolve(self, request, pk=None):
		alert = self.get_object()
		if not alert.is_resolved:
			alert.is_resolved = True
			alert.resolved_at = timezone.now()
			alert.resolved_by = request.user
			alert.save(update_fields=["is_resolved", "resolved_at", "resolved_by"])
		return Response(AlertSerializer(alert).data)

# Create your views here.
