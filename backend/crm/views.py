from rest_framework import viewsets

from config.permissions import IsAdminOrReadOnly

from .models import Customer, Supplier
from .serializers import CustomerSerializer, SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
	queryset = Customer.objects.all().order_by("name")
	serializer_class = CustomerSerializer
	permission_classes = [IsAdminOrReadOnly]


class SupplierViewSet(viewsets.ModelViewSet):
	queryset = Supplier.objects.all().order_by("name")
	serializer_class = SupplierSerializer
	permission_classes = [IsAdminOrReadOnly]

# Create your views here.
