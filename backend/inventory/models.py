from django.conf import settings
from django.db import models


class Product(models.Model):
	company = models.ForeignKey("accounts.Company", on_delete=models.CASCADE, related_name="products")
	name = models.CharField(max_length=200)
	category = models.CharField(max_length=60, default="otros")
	sku = models.CharField(max_length=80)
	barcode = models.CharField(max_length=120, blank=True)
	qr_code = models.CharField(max_length=120, blank=True)
	description = models.TextField(blank=True)
	unit = models.CharField(max_length=40, default="unidad")
	stock_minimo = models.IntegerField(default=0)
	stock_maximo = models.IntegerField(default=0)
	stock_actual = models.IntegerField(default=0)
	fecha_compra = models.DateField(null=True, blank=True)
	fecha_vencimiento = models.DateField(null=True, blank=True)
	periodo_garantia_meses = models.PositiveIntegerField(null=True, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=["company", "sku"], name="uniq_product_company_sku"),
			models.UniqueConstraint(
				fields=["company", "barcode"],
				condition=~models.Q(barcode=""),
				name="uniq_product_company_barcode",
			),
			models.UniqueConstraint(
				fields=["company", "qr_code"],
				condition=~models.Q(qr_code=""),
				name="uniq_product_company_qr",
			),
		]

	def __str__(self):
		return f"{self.name} ({self.sku}) - {self.company.slug}"


class InventoryMovement(models.Model):
	TYPE_IN = "IN"
	TYPE_OUT = "OUT"
	TYPE_ADJ = "ADJ"
	TYPE_CHOICES = [
		(TYPE_IN, "Entrada"),
		(TYPE_OUT, "Salida"),
		(TYPE_ADJ, "Ajuste"),
	]

	company = models.ForeignKey("accounts.Company", on_delete=models.CASCADE, related_name="inventory_movements")
	product = models.ForeignKey(Product, on_delete=models.CASCADE)
	movement_type = models.CharField(max_length=3, choices=TYPE_CHOICES)
	quantity = models.IntegerField()
	previous_stock = models.IntegerField()
	new_stock = models.IntegerField()
	reason = models.CharField(max_length=255, blank=True)
	supplier = models.ForeignKey(
		"crm.Supplier",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)
	customer = models.ForeignKey(
		"crm.Customer",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.product} - {self.movement_type} ({self.quantity})"

# Create your models here.
