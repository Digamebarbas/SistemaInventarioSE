import csv
import io

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from config.permissions import CanCreateInventoryMovement, IsAdminOrReadOnly, is_platform_admin

from .models import InventoryMovement, Product
from .serializers import InventoryMovementSerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
	queryset = Product.objects.all().order_by("name")
	serializer_class = ProductSerializer
	permission_classes = [IsAdminOrReadOnly]
	filterset_fields = ["name", "sku", "barcode", "qr_code", "is_active"]
	parser_classes = [MultiPartParser, FormParser]

	@action(detail=False, methods=["post"], url_path="import_file")
	def import_file(self, request):
		file_obj = request.FILES.get("file")
		if not file_obj:
			return Response(
				{"detail": "Debe adjuntar un archivo CSV en el campo 'file'."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if not file_obj.name.lower().endswith(".csv"):
			return Response(
				{"detail": "Solo se permite importar archivos CSV."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		try:
			decoded = file_obj.read().decode("utf-8-sig")
		except UnicodeDecodeError:
			return Response(
				{"detail": "El archivo debe estar codificado en UTF-8."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		reader = csv.DictReader(io.StringIO(decoded))
		if not reader.fieldnames:
			return Response(
				{"detail": "El archivo CSV no contiene encabezados."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		normalized_fields = {field.strip().lower() for field in reader.fieldnames if field}
		required_fields = {"name", "sku"}
		if not required_fields.issubset(normalized_fields):
			return Response(
				{"detail": "El CSV debe incluir las columnas: name, sku."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		created_count = 0
		errors = []

		for index, raw_row in enumerate(reader, start=2):
			row = {(key or "").strip().lower(): (value or "").strip() for key, value in raw_row.items()}
			name = row.get("name", "")
			sku = row.get("sku", "")
			if not name or not sku:
				errors.append({"line": index, "error": "Campos obligatorios faltantes (name, sku)."})
				continue

			if Product.objects.filter(sku=sku).exists():
				errors.append({"line": index, "error": f"El SKU '{sku}' ya existe."})
				continue

			try:
				stock_minimo = int(row.get("stock_minimo", "0") or 0)
				stock_actual = int(row.get("stock_actual", "0") or 0)
			except ValueError:
				errors.append({"line": index, "error": "stock_minimo y stock_actual deben ser números enteros."})
				continue

			if stock_actual < 0 or stock_minimo < 0:
				errors.append({"line": index, "error": "stock_minimo y stock_actual no pueden ser negativos."})
				continue

			barcode = row.get("barcode", "")
			qr_code = row.get("qr_code", "")
			if not barcode:
				barcode = f"IMP-BAR-{sku}"
			if not qr_code:
				qr_code = f"IMP-QR-{sku}"

			try:
				with transaction.atomic():
					product = Product.objects.create(
						name=name,
						sku=sku,
						barcode=barcode,
						qr_code=qr_code,
						description=row.get("description", ""),
						unit=row.get("unit", "unidad") or "unidad",
						stock_minimo=stock_minimo,
						stock_actual=0,
					)

					if stock_actual > 0:
						InventoryMovement.objects.create(
							product=product,
							movement_type=InventoryMovement.TYPE_IN,
							quantity=stock_actual,
							previous_stock=0,
							new_stock=stock_actual,
							reason="Carga inicial por importación de archivo",
							created_by=request.user if request.user.is_authenticated else None,
						)
						product.stock_actual = stock_actual
						product.save(update_fields=["stock_actual", "updated_at"])
			except Exception as exc:
				errors.append({"line": index, "error": str(exc)})
				continue

			created_count += 1

		return Response(
			{
				"created": created_count,
				"errors": errors,
				"message": "Importación completada.",
			},
			status=status.HTTP_200_OK,
		)


class InventoryMovementViewSet(viewsets.ModelViewSet):
	queryset = InventoryMovement.objects.select_related(
		"product",
		"supplier",
		"customer",
		"created_by",
	)
	serializer_class = InventoryMovementSerializer
	permission_classes = [CanCreateInventoryMovement]
	http_method_names = ["get", "post", "head", "options"]
	filterset_fields = [
		"movement_type",
		"product",
		"supplier",
		"customer",
		"created_by",
	]

	def get_queryset(self):
		qs = InventoryMovement.objects.select_related(
			"product",
			"supplier",
			"customer",
			"created_by",
		)
		if is_platform_admin(self.request.user):
			return qs
		return qs.filter(created_by=self.request.user)

# Create your views here.
