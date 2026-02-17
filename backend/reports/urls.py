from django.urls import path

from .views import (
    CurrentStockReport,
    EntriesBySupplierReport,
    ExitsByCustomerReport,
    LowStockReport,
    MovementRangeReport,
    TopProductsReport,
)

urlpatterns = [
    path("current-stock/", CurrentStockReport.as_view(), name="report-current-stock"),
    path("low-stock/", LowStockReport.as_view(), name="report-low-stock"),
    path("movements/", MovementRangeReport.as_view(), name="report-movements"),
    path("entries-by-supplier/", EntriesBySupplierReport.as_view(), name="report-entries"),
    path("exits-by-customer/", ExitsByCustomerReport.as_view(), name="report-exits"),
    path("top-products/", TopProductsReport.as_view(), name="report-top-products"),
]
