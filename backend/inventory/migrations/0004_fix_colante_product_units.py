from django.db import migrations


def fix_colante_units(apps, schema_editor):
    Product = apps.get_model("inventory", "Product")

    unit_by_sku = {
        "COL-LAC-001": "litro",
        "COL-LAC-002": "gramo",
        "COL-LAC-003": "gramo",
    }

    for sku, unit in unit_by_sku.items():
        Product.objects.filter(sku=sku).update(unit=unit)


def revert_colante_units(apps, schema_editor):
    Product = apps.get_model("inventory", "Product")
    Product.objects.filter(sku__in=["COL-LAC-001", "COL-LAC-002", "COL-LAC-003"]).update(unit="unidad")


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0003_seed_colante_products"),
    ]

    operations = [
        migrations.RunPython(fix_colante_units, revert_colante_units),
    ]
