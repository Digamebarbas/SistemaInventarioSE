from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0006_add_category_product"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="fecha_compra",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="periodo_garantia_meses",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="stock_maximo",
            field=models.IntegerField(default=0),
        ),
    ]
