import csv
import io
from django.core.exceptions import ValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

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

	@action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
	def import_csv(self, request):
		file = request.FILES.get("file")
		if not file:
			return Response(
				{"detail": "No file provided."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		company = get_request_company(request)
		if not company:
			return Response(
				{"detail": "Company not found."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		try:
			decoded_file = file.read().decode("utf-8")
			csv_reader = csv.DictReader(io.StringIO(decoded_file))
			
			if not csv_reader.fieldnames:
				return Response(
					{"detail": "CSV file is empty."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			required_fields = {"name"}
			provided_fields = set(csv_reader.fieldnames or [])
			
			if not required_fields.issubset(provided_fields):
				return Response(
					{"detail": f"CSV must contain at least these columns: {', '.join(required_fields)}"},
					status=status.HTTP_400_BAD_REQUEST,
				)

			created_count = 0
			skipped_count = 0
			errors = []

			for row_num, row in enumerate(csv_reader, start=2):
				try:
					name = row.get("name", "").strip()
					if not name:
						errors.append(f"Row {row_num}: Name is required.")
						skipped_count += 1
						continue

					customer, created = Customer.objects.get_or_create(
						company=company,
						name=name,
						defaults={
							"email": row.get("email", "").strip() or "",
							"phone": row.get("phone", "").strip() or "",
							"address": row.get("address", "").strip() or "",
							"tax_id": row.get("tax_id", "").strip() or "",
						},
					)

					if created:
						created_count += 1
					else:
						skipped_count += 1
						errors.append(f"Row {row_num}: Customer '{name}' already exists.")

				except ValidationError as e:
					errors.append(f"Row {row_num}: {str(e)}")
					skipped_count += 1
				except Exception as e:
					errors.append(f"Row {row_num}: {str(e)}")
					skipped_count += 1

			return Response(
				{
					"created": created_count,
					"skipped": skipped_count,
					"errors": errors[:10],
				},
				status=status.HTTP_200_OK,
			)

		except Exception as e:
			return Response(
				{"detail": f"Error processing CSV: {str(e)}"},
				status=status.HTTP_400_BAD_REQUEST,
			)


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

	@action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
	def import_csv(self, request):
		file = request.FILES.get("file")
		if not file:
			return Response(
				{"detail": "No file provided."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		company = get_request_company(request)
		if not company:
			return Response(
				{"detail": "Company not found."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		try:
			decoded_file = file.read().decode("utf-8")
			csv_reader = csv.DictReader(io.StringIO(decoded_file))
			
			if not csv_reader.fieldnames:
				return Response(
					{"detail": "CSV file is empty."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			required_fields = {"name"}
			provided_fields = set(csv_reader.fieldnames or [])
			
			if not required_fields.issubset(provided_fields):
				return Response(
					{"detail": f"CSV must contain at least these columns: {', '.join(required_fields)}"},
					status=status.HTTP_400_BAD_REQUEST,
				)

			created_count = 0
			skipped_count = 0
			errors = []

			for row_num, row in enumerate(csv_reader, start=2):
				try:
					name = row.get("name", "").strip()
					if not name:
						errors.append(f"Row {row_num}: Name is required.")
						skipped_count += 1
						continue

					supplier, created = Supplier.objects.get_or_create(
						company=company,
						name=name,
						defaults={
							"email": row.get("email", "").strip() or "",
							"phone": row.get("phone", "").strip() or "",
							"address": row.get("address", "").strip() or "",
							"tax_id": row.get("tax_id", "").strip() or "",
						},
					)

					if created:
						created_count += 1
					else:
						skipped_count += 1
						errors.append(f"Row {row_num}: Supplier '{name}' already exists.")

				except ValidationError as e:
					errors.append(f"Row {row_num}: {str(e)}")
					skipped_count += 1
				except Exception as e:
					errors.append(f"Row {row_num}: {str(e)}")
					skipped_count += 1

			return Response(
				{
					"created": created_count,
					"skipped": skipped_count,
					"errors": errors[:10],
				},
				status=status.HTTP_200_OK,
			)

		except Exception as e:
			return Response(
				{"detail": f"Error processing CSV: {str(e)}"},
				status=status.HTTP_400_BAD_REQUEST,
			)

# Create your views here.
