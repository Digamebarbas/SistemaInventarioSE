from django.db import migrations


def configure_demo_companies(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    User = apps.get_model("auth", "User")
    UserCompany = apps.get_model("accounts", "UserCompany")

    Product = apps.get_model("inventory", "Product")
    InventoryMovement = apps.get_model("inventory", "InventoryMovement")
    Customer = apps.get_model("crm", "Customer")
    Supplier = apps.get_model("crm", "Supplier")

    def move_data_and_delete(source, target):
        Product.objects.filter(company=source).update(company=target)
        InventoryMovement.objects.filter(company=source).update(company=target)
        Customer.objects.filter(company=source).update(company=target)
        Supplier.objects.filter(company=source).update(company=target)
        UserCompany.objects.filter(company=source).update(company=target)
        source.delete()

    all_technology = Company.objects.filter(slug="all-technology").first()
    tecnologia = Company.objects.filter(slug="tecnologia").first()

    if tecnologia and not all_technology:
        tecnologia.slug = "all-technology"
        tecnologia.name = "All Technology"
        tecnologia.is_active = True
        tecnologia.save(update_fields=["slug", "name", "is_active"])
        all_technology = tecnologia
    elif tecnologia and all_technology and tecnologia.id != all_technology.id:
        move_data_and_delete(tecnologia, all_technology)

    if not all_technology:
        all_technology = Company.objects.create(
            slug="all-technology",
            name="All Technology",
            is_active=True,
        )

    colante = Company.objects.filter(slug="colante").first()
    alimentos = Company.objects.filter(slug="alimentos").first()

    if alimentos and not colante:
        alimentos.slug = "colante"
        alimentos.name = "Colante"
        alimentos.is_active = True
        alimentos.save(update_fields=["slug", "name", "is_active"])
        colante = alimentos
    elif alimentos and colante and alimentos.id != colante.id:
        move_data_and_delete(alimentos, colante)

    if not colante:
        colante = Company.objects.create(
            slug="colante",
            name="Colante",
            is_active=True,
        )

    # Ensure platform admins can access both demo companies.
    admin_users = User.objects.filter(is_active=True).filter(is_superuser=True) | User.objects.filter(is_active=True).filter(is_staff=True)
    for user in admin_users.distinct():
        UserCompany.objects.get_or_create(user=user, company=all_technology, defaults={"is_default": True})
        UserCompany.objects.get_or_create(user=user, company=colante, defaults={"is_default": False})


def rollback_demo_companies(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    all_technology = Company.objects.filter(slug="all-technology").first()
    colante = Company.objects.filter(slug="colante").first()

    if all_technology:
        all_technology.slug = "tecnologia"
        all_technology.name = "Empresa de Productos Tecnologicos"
        all_technology.save(update_fields=["slug", "name"])

    if colante:
        colante.slug = "alimentos"
        colante.name = "Empresa de Alimentos"
        colante.save(update_fields=["slug", "name"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_seed_companies"),
        ("crm", "0002_company_multitenant"),
        ("inventory", "0002_company_multitenant"),
    ]

    operations = [
        migrations.RunPython(configure_demo_companies, rollback_demo_companies),
    ]
