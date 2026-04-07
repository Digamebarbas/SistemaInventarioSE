from rest_framework import permissions, viewsets

from accounts.tenancy import get_request_company
from .models import Customer, Supplier
from .serializers import CustomerSerializer, SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
	queryset = Customer.objects.all().order_by("name")
	serializer_class = CustomerSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		company = get_request_company(self.request)
		if not company:
			return Customer.objects.none()
		return Customer.objects.filter(company=company).order_by("name")

	def perform_create(self, serializer):
		company = get_request_company(self.request)
		serializer.save(company=company)


class SupplierViewSet(viewsets.ModelViewSet):
	queryset = Supplier.objects.all().order_by("name")
	serializer_class = SupplierSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		company = get_request_company(self.request)
		if not company:
			return Supplier.objects.none()
		return Supplier.objects.filter(company=company).order_by("name")

	def perform_create(self, serializer):
		company = get_request_company(self.request)
		serializer.save(company=company)

# Create your views here.
