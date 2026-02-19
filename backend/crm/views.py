from rest_framework import permissions, viewsets

from .models import Customer, Supplier
from .serializers import CustomerSerializer, SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
	queryset = Customer.objects.all().order_by("name")
	serializer_class = CustomerSerializer
	permission_classes = [permissions.IsAuthenticated]


class SupplierViewSet(viewsets.ModelViewSet):
	queryset = Supplier.objects.all().order_by("name")
	serializer_class = SupplierSerializer
	permission_classes = [permissions.IsAuthenticated]

# Create your views here.
