from django.db import models
from django.db.models import Count, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsPlatformAdmin

from inventory.models import InventoryMovement, Product


class CurrentStockReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		products = Product.objects.values(
			"id",
			"name",
			"sku",
			"stock_actual",
			"stock_minimo",
		).order_by("name")
		return Response(list(products))


class LowStockReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		products = Product.objects.filter(
			stock_actual__lte=models.F("stock_minimo")
		).values("id", "name", "sku", "stock_actual", "stock_minimo")
		return Response(list(products))


class MovementRangeReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		start = request.query_params.get("start")
		end = request.query_params.get("end")

		qs = InventoryMovement.objects.select_related("product")
		if start:
			qs = qs.filter(created_at__date__gte=start)
		if end:
			qs = qs.filter(created_at__date__lte=end)

		data = qs.values(
			"id",
			"movement_type",
			"quantity",
			"created_at",
			"product__name",
			"product__sku",
		).order_by("-created_at")
		return Response(list(data))


class EntriesBySupplierReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		qs = InventoryMovement.objects.filter(movement_type=InventoryMovement.TYPE_IN)
		data = (
			qs.values("supplier__id", "supplier__name")
			.annotate(total=Sum("quantity"))
			.order_by("-total")
		)
		return Response(list(data))


class ExitsByCustomerReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		qs = InventoryMovement.objects.filter(movement_type=InventoryMovement.TYPE_OUT)
		data = (
			qs.values("customer__id", "customer__name")
			.annotate(total=Sum("quantity"))
			.order_by("-total")
		)
		return Response(list(data))


class TopProductsReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		qs = InventoryMovement.objects.filter(movement_type=InventoryMovement.TYPE_OUT)
		data = (
			qs.values("product__id", "product__name", "product__sku")
			.annotate(total=Sum("quantity"), movements=Count("id"))
			.order_by("-total")[:10]
		)
		return Response(list(data))

# Create your views here.
