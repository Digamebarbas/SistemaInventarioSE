from django.conf import settings
from django.db import models


class Product(models.Model):
	name = models.CharField(max_length=200)
	sku = models.CharField(max_length=80, unique=True)
	barcode = models.CharField(max_length=120, blank=True, unique=True)
	qr_code = models.CharField(max_length=120, blank=True, unique=True)
	description = models.TextField(blank=True)
	unit = models.CharField(max_length=40, default="unidad")
	stock_minimo = models.IntegerField(default=0)
	stock_actual = models.IntegerField(default=0)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.name} ({self.sku})"


class InventoryMovement(models.Model):
	TYPE_IN = "IN"
	TYPE_OUT = "OUT"
	TYPE_ADJ = "ADJ"
	TYPE_CHOICES = [
		(TYPE_IN, "Entrada"),
		(TYPE_OUT, "Salida"),
		(TYPE_ADJ, "Ajuste"),
	]

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
