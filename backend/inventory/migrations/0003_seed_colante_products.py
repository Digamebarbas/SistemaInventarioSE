from django.db import migrations


def seed_colante_products(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    Product = apps.get_model("inventory", "Product")

    colante = Company.objects.filter(slug="colante", is_active=True).first()
    if not colante:
        return

    demo_products = [
        {
            "name": "Leche Entera 1L",
            "sku": "COL-LAC-001",
            "barcode": "770100000001",
            "qr_code": "QR-COL-LAC-001",
            "unit": "unidad",
            "stock_minimo": 20,
            "stock_actual": 120,
            "description": "Leche entera pasteurizada.",
            "is_active": True,
        },
        {
            "name": "Yogur Natural 500g",
            "sku": "COL-LAC-002",
            "barcode": "770100000002",
            "qr_code": "QR-COL-LAC-002",
            "unit": "unidad",
            "stock_minimo": 15,
            "stock_actual": 80,
            "description": "Yogur natural sin azucar.",
            "is_active": True,
        },
        {
            "name": "Queso Campesino 250g",
            "sku": "COL-LAC-003",
            "barcode": "770100000003",
            "qr_code": "QR-COL-LAC-003",
            "unit": "unidad",
            "stock_minimo": 10,
            "stock_actual": 60,
            "description": "Queso fresco tipo campesino.",
            "is_active": True,
        },
    ]

    for payload in demo_products:
        Product.objects.get_or_create(
            company=colante,
            sku=payload["sku"],
            defaults=payload,
        )


def rollback_colante_products(apps, schema_editor):
    Product = apps.get_model("inventory", "Product")
    Product.objects.filter(sku__in=["COL-LAC-001", "COL-LAC-002", "COL-LAC-003"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_configure_demo_companies"),
        ("inventory", "0002_company_multitenant"),
    ]

    operations = [
        migrations.RunPython(seed_colante_products, rollback_colante_products),
    ]
