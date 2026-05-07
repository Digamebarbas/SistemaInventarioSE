from django.db import transaction
from rest_framework import serializers

from accounts.tenancy import get_request_company
from alerts.utils import ensure_stock_alert

from .models import InventoryMovement, Product


class ProductSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(source="company.id", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    uses_warranty_period = serializers.BooleanField(source="company.uses_warranty_period", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "company_id",
            "company_name",
            "name",
            "category",
            "sku",
            "barcode",
            "qr_code",
            "description",
            "unit",
            "stock_minimo",
            "stock_maximo",
            "stock_actual",
            "fecha_compra",
            "fecha_vencimiento",
            "periodo_garantia_meses",
            "uses_warranty_period",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        company = None
        if self.instance:
            company = self.instance.company

        request = self.context.get("request")
        if request and hasattr(request, "user"):
            request_company = get_request_company(request)
            if request_company:
                company = request_company

        if not company:
            return attrs

        fecha_vencimiento = attrs.get("fecha_vencimiento", getattr(self.instance, "fecha_vencimiento", None))
        periodo_garantia_meses = attrs.get("periodo_garantia_meses", getattr(self.instance, "periodo_garantia_meses", None))
        stock_minimo = attrs.get("stock_minimo", getattr(self.instance, "stock_minimo", 0))
        stock_maximo = attrs.get("stock_maximo", getattr(self.instance, "stock_maximo", 0))

        if stock_maximo < 0:
            raise serializers.ValidationError({"stock_maximo": "El stock maximo no puede ser negativo."})

        if stock_maximo and stock_maximo < stock_minimo:
            raise serializers.ValidationError({"stock_maximo": "El stock maximo debe ser mayor o igual al stock minimo."})

        if company.uses_warranty_period:
            if fecha_vencimiento:
                raise serializers.ValidationError(
                    {"fecha_vencimiento": "Esta empresa maneja garantias; no debe registrar fecha de vencimiento."}
                )
        else:
            if periodo_garantia_meses:
                raise serializers.ValidationError(
                    {"periodo_garantia_meses": "Esta empresa maneja vencimientos; no debe registrar periodo de garantia."}
                )

        return attrs


class InventoryMovementSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    movement_type_label = serializers.CharField(source="get_movement_type_display", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
            "product",
            "product_name",
            "movement_type",
            "movement_type_label",
            "quantity",
            "previous_stock",
            "new_stock",
            "reason",
            "supplier",
            "supplier_name",
            "customer",
            "customer_name",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = ["previous_stock", "new_stock", "created_by", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        company = get_request_company(request) if request else None
        if not company:
            raise serializers.ValidationError("No se pudo resolver la empresa activa.")

        product = attrs["product"]
        movement_type = attrs["movement_type"]
        quantity = attrs["quantity"]
        supplier = attrs.get("supplier")
        customer = attrs.get("customer")

        if product.company_id != company.id:
            raise serializers.ValidationError("El producto no pertenece a la empresa activa.")

        if supplier and supplier.company_id != company.id:
            raise serializers.ValidationError("El proveedor no pertenece a la empresa activa.")

        if customer and customer.company_id != company.id:
            raise serializers.ValidationError("El cliente no pertenece a la empresa activa.")

        if movement_type in [InventoryMovement.TYPE_IN, InventoryMovement.TYPE_OUT] and quantity <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a cero.")

        if movement_type == InventoryMovement.TYPE_OUT:
            if product.stock_actual - quantity < 0:
                raise serializers.ValidationError("Stock insuficiente para la salida.")

        if movement_type == InventoryMovement.TYPE_ADJ and quantity == 0:
            raise serializers.ValidationError("El ajuste no puede ser cero.")

        if movement_type == InventoryMovement.TYPE_OUT and not customer:
            raise serializers.ValidationError("Debe seleccionar un cliente para la salida de inventario.")

        if movement_type in [InventoryMovement.TYPE_IN, InventoryMovement.TYPE_ADJ] and not supplier:
            raise serializers.ValidationError("Debe seleccionar un proveedor para entrada o ajuste de inventario.")

        if movement_type == InventoryMovement.TYPE_OUT and supplier:
            raise serializers.ValidationError("No debe asociar proveedor en una salida de inventario.")

        if movement_type in [InventoryMovement.TYPE_IN, InventoryMovement.TYPE_ADJ] and customer:
            raise serializers.ValidationError("No debe asociar cliente en entrada o ajuste de inventario.")

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        company = get_request_company(request) if request else None
        product = validated_data["product"]
        movement_type = validated_data["movement_type"]
        quantity = validated_data["quantity"]

        with transaction.atomic():
            previous_stock = product.stock_actual
            if movement_type == InventoryMovement.TYPE_IN:
                new_stock = previous_stock + quantity
            elif movement_type == InventoryMovement.TYPE_OUT:
                new_stock = previous_stock - quantity
            else:
                new_stock = previous_stock + quantity

            if new_stock < 0:
                raise serializers.ValidationError("El stock resultante no puede ser negativo.")

            product.stock_actual = new_stock
            product.save(update_fields=["stock_actual", "updated_at"])

            movement = InventoryMovement.objects.create(
                company=company,
                product=product,
                movement_type=movement_type,
                quantity=quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reason=validated_data.get("reason", ""),
                supplier=validated_data.get("supplier"),
                customer=validated_data.get("customer"),
                created_by=user,
            )

            ensure_stock_alert(product, user)

        return movement
