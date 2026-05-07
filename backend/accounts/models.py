from django.contrib.auth.models import User
from django.db import models


class Company(models.Model):
	name = models.CharField(max_length=200, unique=True)
	slug = models.SlugField(max_length=80, unique=True)
	uses_warranty_period = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["name"]

	def __str__(self):
		return self.name


class UserCompany(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="company_memberships")
	company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="user_memberships")
	is_default = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ("user", "company")
		ordering = ["-is_default", "company__name"]

	def __str__(self):
		return f"{self.user.username} -> {self.company.slug}"
