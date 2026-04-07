from rest_framework import serializers

from .models import Customer, Supplier


class CustomerSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(source="company.id", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Customer
        fields = ["id", "company_id", "company_name", "name", "email", "phone", "address", "tax_id", "created_at"]


class SupplierSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(source="company.id", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Supplier
        fields = ["id", "company_id", "company_name", "name", "email", "phone", "address", "tax_id", "created_at"]
