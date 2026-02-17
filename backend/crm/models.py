from django.db import models


class Customer(models.Model):
	name = models.CharField(max_length=200)
	email = models.EmailField(blank=True)
	phone = models.CharField(max_length=50, blank=True)
	address = models.CharField(max_length=255, blank=True)
	tax_id = models.CharField(max_length=50, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class Supplier(models.Model):
	name = models.CharField(max_length=200)
	email = models.EmailField(blank=True)
	phone = models.CharField(max_length=50, blank=True)
	address = models.CharField(max_length=255, blank=True)
	tax_id = models.CharField(max_length=50, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name

# Create your models here.
