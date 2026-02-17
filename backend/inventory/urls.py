from rest_framework.routers import DefaultRouter

from .views import InventoryMovementViewSet, ProductViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("movements", InventoryMovementViewSet, basename="movement")

urlpatterns = router.urls
