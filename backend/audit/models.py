from django.conf import settings
from django.db import models


class AuditLog(models.Model):
	action = models.CharField(max_length=30)
	model = models.CharField(max_length=120)
	object_id = models.CharField(max_length=120)
	data = models.JSONField()
	ip_address = models.GenericIPAddressField(null=True, blank=True)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def save(self, *args, **kwargs):
		if self.pk:
			raise ValueError("Audit logs are immutable")
		super().save(*args, **kwargs)

# Create your models here.
