from django.db import migrations


def seed_companies_and_memberships(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    UserCompany = apps.get_model("accounts", "UserCompany")
    User = apps.get_model("auth", "User")

    tech_company, _ = Company.objects.get_or_create(
        slug="tecnologia",
        defaults={"name": "Empresa de Productos Tecnologicos", "is_active": True},
    )
    food_company, _ = Company.objects.get_or_create(
        slug="alimentos",
        defaults={"name": "Empresa de Alimentos", "is_active": True},
    )

    for user in User.objects.all().iterator():
        UserCompany.objects.get_or_create(
            user=user,
            company=tech_company,
            defaults={"is_default": True},
        )

        if user.is_superuser or user.is_staff:
            UserCompany.objects.get_or_create(
                user=user,
                company=food_company,
                defaults={"is_default": False},
            )


def rollback_seed(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    Company.objects.filter(slug__in=["tecnologia", "alimentos"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_companies_and_memberships, rollback_seed),
    ]
