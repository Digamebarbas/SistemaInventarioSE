from django.conf import settings
from django.db import models


class Alert(models.Model):
	product = models.ForeignKey("inventory.Product", on_delete=models.CASCADE)
	message = models.CharField(max_length=255)
	is_resolved = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	resolved_at = models.DateTimeField(null=True, blank=True)
	resolved_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.product} - {self.message}"

# Create your models here.
