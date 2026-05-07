import csv

from django.http import HttpResponse
from django.db import models
from django.db.models import Count, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.tenancy import get_request_company
from config.permissions import IsPlatformAdmin

from inventory.models import InventoryMovement, Product


def maybe_csv_response(request, rows, filename_prefix):
	if request.query_params.get("export") != "csv":
		return None

	response = HttpResponse(content_type="text/csv")
	response["Content-Disposition"] = f'attachment; filename="{filename_prefix}.csv"'

	writer = csv.writer(response)
	if not rows:
		return response

	headers = list(rows[0].keys())
	writer.writerow(headers)
	for row in rows:
		writer.writerow([row.get(header) for header in headers])

	return response


class CurrentStockReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		company = get_request_company(request)
		products = Product.objects.filter(company=company).values(
			"id",
			"name",
			"sku",
			"stock_actual",
			"stock_minimo",
			"stock_maximo",
		).order_by("name")
		rows = list(products)
		csv_response = maybe_csv_response(request, rows, "reporte_stock_actual")
		if csv_response:
			return csv_response
		return Response(rows)


class LowStockReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		company = get_request_company(request)
		products = Product.objects.filter(
			company=company,
			stock_actual__lte=models.F("stock_minimo")
		).values("id", "name", "sku", "stock_actual", "stock_minimo", "stock_maximo")
		rows = list(products)
		csv_response = maybe_csv_response(request, rows, "reporte_stock_bajo")
		if csv_response:
			return csv_response
		return Response(rows)


class MovementRangeReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		start = request.query_params.get("start")
		end = request.query_params.get("end")
		company = get_request_company(request)

		qs = InventoryMovement.objects.select_related("product").filter(company=company)
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
		rows = list(data)
		csv_response = maybe_csv_response(request, rows, "reporte_movimientos")
		if csv_response:
			return csv_response
		return Response(rows)


class EntriesBySupplierReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		company = get_request_company(request)
		qs = InventoryMovement.objects.filter(company=company, movement_type=InventoryMovement.TYPE_IN)
		data = (
			qs.values("supplier__id", "supplier__name")
			.annotate(total=Sum("quantity"))
			.order_by("-total")
		)
		rows = list(data)
		csv_response = maybe_csv_response(request, rows, "reporte_entradas_proveedor")
		if csv_response:
			return csv_response
		return Response(rows)


class ExitsByCustomerReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		company = get_request_company(request)
		qs = InventoryMovement.objects.filter(company=company, movement_type=InventoryMovement.TYPE_OUT)
		data = (
			qs.values("customer__id", "customer__name")
			.annotate(total=Sum("quantity"))
			.order_by("-total")
		)
		rows = list(data)
		csv_response = maybe_csv_response(request, rows, "reporte_salidas_cliente")
		if csv_response:
			return csv_response
		return Response(rows)


class TopProductsReport(APIView):
	permission_classes = [IsPlatformAdmin]

	def get(self, request):
		company = get_request_company(request)
		qs = InventoryMovement.objects.filter(company=company, movement_type=InventoryMovement.TYPE_OUT)
		data = (
			qs.values("product__id", "product__name", "product__sku")
			.annotate(total=Sum("quantity"), movements=Count("id"))
			.order_by("-total")[:10]
		)
		rows = list(data)
		csv_response = maybe_csv_response(request, rows, "reporte_top_productos")
		if csv_response:
			return csv_response
		return Response(rows)

# Create your views here.
