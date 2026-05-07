import csv
import io

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.tenancy import get_request_company
from config.permissions import CanCreateInventoryMovement, IsAdminOrReadOnly, is_platform_admin

from .models import InventoryMovement, Product
from .serializers import InventoryMovementSerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
	queryset = Product.objects.select_related("company").all().order_by("name")
	serializer_class = ProductSerializer
	permission_classes = [IsAdminOrReadOnly]
	filterset_fields = ["name", "category", "sku", "barcode", "qr_code", "is_active"]
	parser_classes = [MultiPartParser, FormParser]

	def get_queryset(self):
		company = get_request_company(self.request)
		if not company:
			return Product.objects.none()
		return Product.objects.select_related("company").filter(company=company).order_by("name")

	def perform_create(self, serializer):
		company = get_request_company(self.request)
		serializer.save(company=company)

	@action(detail=False, methods=["post"], url_path="import_file")
	def import_file(self, request):
		company = get_request_company(request)
		if not company:
			return Response({"detail": "No se pudo resolver la empresa activa."}, status=status.HTTP_400_BAD_REQUEST)

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

			if Product.objects.filter(company=company, sku=sku).exists():
				errors.append({"line": index, "error": f"El SKU '{sku}' ya existe."})
				continue

			try:
				stock_minimo = int(row.get("stock_minimo", "0") or 0)
				stock_maximo = int(row.get("stock_maximo", "0") or 0)
				stock_actual = int(row.get("stock_actual", "0") or 0)
			except ValueError:
				errors.append({"line": index, "error": "stock_minimo, stock_maximo y stock_actual deben ser numeros enteros."})
				continue

			if stock_maximo < 0:
				errors.append({"line": index, "error": "stock_maximo no puede ser negativo."})
				continue

			if stock_maximo and stock_maximo < stock_minimo:
				errors.append({"line": index, "error": "stock_maximo debe ser mayor o igual al stock_minimo."})
				continue

			barcode = row.get("barcode", "")
			qr_code = row.get("qr_code", "")

			fecha_vencimiento_raw = row.get("fecha_vencimiento", "").strip()
			fecha_vencimiento = None
			if fecha_vencimiento_raw and not company.uses_warranty_period:
				from datetime import datetime
				try:
					fecha_vencimiento = datetime.strptime(fecha_vencimiento_raw, "%Y-%m-%d").date()
				except ValueError:
					errors.append({"line": index, "error": f"fecha_vencimiento inválida '{fecha_vencimiento_raw}'. Use formato YYYY-MM-DD."})
					continue

			periodo_garantia_raw = row.get("periodo_garantia_meses", "").strip()
			periodo_garantia_meses = None
			if periodo_garantia_raw and company.uses_warranty_period:
				try:
					periodo_garantia_meses = int(periodo_garantia_raw)
				except ValueError:
					errors.append({"line": index, "error": f"periodo_garantia_meses inválido '{periodo_garantia_raw}'."})
					continue

			if not company.uses_warranty_period:
				periodo_garantia_meses = None
			else:
				fecha_vencimiento = None

			fecha_compra_raw = row.get("fecha_compra", "").strip()
			fecha_compra = None
			if fecha_compra_raw:
				from datetime import datetime
				try:
					fecha_compra = datetime.strptime(fecha_compra_raw, "%Y-%m-%d").date()
				except ValueError:
					errors.append({"line": index, "error": f"fecha_compra inválida '{fecha_compra_raw}'. Use formato YYYY-MM-DD."})
					continue

			if not barcode:
				barcode = f"IMP-BAR-{sku}"
			if not qr_code:
				qr_code = f"IMP-QR-{sku}"

			try:
				with transaction.atomic():
					product = Product.objects.create(
						company=company,
						name=name,
						category=row.get("category", "otros") or "otros",
						sku=sku,
						barcode=barcode,
						qr_code=qr_code,
						description=row.get("description", ""),
						unit=row.get("unit", "unidad") or "unidad",
						stock_minimo=stock_minimo,
						stock_maximo=stock_maximo,
						stock_actual=0,
						fecha_compra=fecha_compra,
						fecha_vencimiento=fecha_vencimiento,
						periodo_garantia_meses=periodo_garantia_meses,
					)

					if stock_actual > 0:
						InventoryMovement.objects.create(
							company=company,
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
		"company",
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
		company = get_request_company(self.request)
		if not company:
			return InventoryMovement.objects.none()

		qs = InventoryMovement.objects.select_related(
			"company",
			"product",
			"supplier",
			"customer",
			"created_by",
		).filter(company=company)
		if is_platform_admin(self.request.user):
			return qs
		return qs.filter(created_by=self.request.user)

# Create your views here.
