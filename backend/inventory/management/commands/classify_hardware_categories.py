from argparse import ArgumentParser
from typing import ClassVar

from django.core.management.base import BaseCommand, CommandError

from accounts.models import Company
from inventory.models import Product


class Command(BaseCommand):
    help = "Clasifica productos de ferreteria en subcategorias mas utiles"

    CATEGORY_RULES: ClassVar[list[tuple[str, tuple[str, ...]]]] = [
        ("tornilleria", ("tornillo",)),
        ("clavos", ("clavo",)),
        ("tuercas y arandelas", ("tuerca", "arandela")),
        ("herrajes", ("tirador", "bisagra", "manija")),
        ("seguridad", ("candado", "cerrojo")),
        (
            "herramientas",
            ("llave inglesa", "martillo", "destornillador", "taladro", "pinza"),
        ),
        ("corte y perforacion", ("broca", "sierra", "hoja sierra")),
        ("cables y cadenas", ("cable", "cadena")),
        ("anclajes", ("anclaje", "perno")),
        ("aislamiento electrico", ("cinta aislante",)),
        ("quimicos", ("lubricante", "desengrasante")),
    ]

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--company-slug",
            default="mi-tornillo",
            help="Slug de la empresa a reclasificar (default: mi-tornillo)",
        )

    def resolve_category(self, product_name: str) -> str:
        normalized_name = product_name.strip().lower()
        for category, keywords in self.CATEGORY_RULES:
            if any(keyword in normalized_name for keyword in keywords):
                return category
        return "ferreteria"

    def handle(self, *args: object, **options: str) -> None:
        company_slug = options["company_slug"].strip().lower()
        company = Company.objects.filter(slug=company_slug, is_active=True).first()
        if not company:
            raise CommandError(f"No existe una empresa activa con slug '{company_slug}'.")

        updated = 0
        unchanged = 0

        for product in Product.objects.filter(company=company).order_by("sku"):
            new_category = self.resolve_category(product.name)
            if product.category == new_category:
                unchanged += 1
                continue

            product.category = new_category
            product.save(update_fields=["category", "updated_at"])
            updated += 1

        distinct_categories = list(
            Product.objects.filter(company=company)
            .order_by("category")
            .values_list("category", flat=True)
            .distinct()
        )

        self.stdout.write(self.style.SUCCESS(f"Empresa: {company.name} ({company.slug})"))
        self.stdout.write(self.style.SUCCESS(f"Productos actualizados: {updated}"))
        self.stdout.write(self.style.SUCCESS(f"Productos sin cambios: {unchanged}"))
        self.stdout.write(self.style.SUCCESS(f"Categorias resultantes: {', '.join(distinct_categories)}"))