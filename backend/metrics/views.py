from django.db import models
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import is_platform_admin
from inventory.models import InventoryMovement, Product


class DashboardMetrics(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		today = timezone.now().date()
		is_admin = is_platform_admin(request.user)

		total_products = Product.objects.count()
		total_stock = Product.objects.aggregate(total=Sum("stock_actual"))["total"] or 0
		critical_products = Product.objects.filter(
			stock_actual__lte=models.F("stock_minimo")
		).count()

		movement_qs = InventoryMovement.objects.all()
		if not is_admin:
			movement_qs = movement_qs.filter(created_by=request.user)

		movements_today = movement_qs.filter(created_at__date=today).count()

		top_products = (
			movement_qs.filter(movement_type=InventoryMovement.TYPE_OUT)
			.values("product__id", "product__name", "product__sku")
			.annotate(total=Sum("quantity"))
			.order_by("-total")[:5]
		)

		monthly_movements = (
			movement_qs.values("movement_type", "created_at__month")
			.annotate(total=Count("id"))
			.order_by("created_at__month")
		)

		return Response(
			{
				"total_products": total_products,
				"total_stock": total_stock,
				"critical_products": critical_products,
				"movements_today": movements_today,
				"is_admin": is_admin,
				"top_products": list(top_products),
				"monthly_movements": list(monthly_movements),
			}
		)

# Create your views here.
