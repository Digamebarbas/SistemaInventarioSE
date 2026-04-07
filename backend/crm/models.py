from django.db import models


class Customer(models.Model):
	company = models.ForeignKey("accounts.Company", on_delete=models.CASCADE, related_name="customers")
	name = models.CharField(max_length=200)
	email = models.EmailField(blank=True)
	phone = models.CharField(max_length=50, blank=True)
	address = models.CharField(max_length=255, blank=True)
	tax_id = models.CharField(max_length=50, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=["company", "name"], name="uniq_customer_company_name"),
		]

	def __str__(self):
		return self.name


class Supplier(models.Model):
	company = models.ForeignKey("accounts.Company", on_delete=models.CASCADE, related_name="suppliers")
	name = models.CharField(max_length=200)
	email = models.EmailField(blank=True)
	phone = models.CharField(max_length=50, blank=True)
	address = models.CharField(max_length=255, blank=True)
	tax_id = models.CharField(max_length=50, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=["company", "name"], name="uniq_supplier_company_name"),
		]

	def __str__(self):
		return self.name

# Create your models here.
