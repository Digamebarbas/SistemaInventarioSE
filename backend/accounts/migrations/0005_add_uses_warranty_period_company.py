from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_add_must_change_password"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="uses_warranty_period",
            field=models.BooleanField(default=False),
        ),
    ]
