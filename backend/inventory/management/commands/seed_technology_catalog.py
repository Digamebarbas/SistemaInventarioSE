from __future__ import annotations

from argparse import ArgumentParser
from typing import Any, ClassVar

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import Company
from inventory.models import Product


PRODUCTS = [
    {"name": "Apple iPhone 15 128GB", "sku": "TEC-PHN-001", "description": "Smartphone Apple iPhone 15 con pantalla OLED de 6.1 pulgadas y chip A16 Bionic.", "stock_minimo": 6, "stock_actual": 18},
    {"name": "Samsung Galaxy S24 256GB", "sku": "TEC-PHN-002", "description": "Smartphone Samsung Galaxy S24 5G con pantalla Dynamic AMOLED y 256GB.", "stock_minimo": 7, "stock_actual": 21},
    {"name": "Xiaomi 14T 256GB", "sku": "TEC-PHN-003", "description": "Smartphone Xiaomi 14T con pantalla AMOLED de 144Hz y almacenamiento de 256GB.", "stock_minimo": 5, "stock_actual": 15},
    {"name": "Motorola Edge 50 Fusion 256GB", "sku": "TEC-PHN-004", "description": "Smartphone Motorola Edge 50 Fusion con carga rapida y 256GB de almacenamiento.", "stock_minimo": 4, "stock_actual": 12},
    {"name": "Google Pixel 8 128GB", "sku": "TEC-PHN-005", "description": "Smartphone Google Pixel 8 con camara avanzada y Android puro.", "stock_minimo": 3, "stock_actual": 9},
    {"name": "HONOR Magic6 Lite 256GB", "sku": "TEC-PHN-006", "description": "Smartphone HONOR Magic6 Lite con pantalla AMOLED curva y bateria de larga duracion.", "stock_minimo": 3, "stock_actual": 10},
    {"name": "Dell Latitude 5450", "sku": "TEC-LTP-001", "description": "Portatil empresarial Dell Latitude 14 pulgadas con procesador Intel Core Ultra.", "stock_minimo": 4, "stock_actual": 10},
    {"name": "HP ProBook 440 G11", "sku": "TEC-LTP-002", "description": "Portatil HP ProBook 14 pulgadas para productividad empresarial.", "stock_minimo": 4, "stock_actual": 11},
    {"name": "Lenovo ThinkPad E14 Gen 6", "sku": "TEC-LTP-003", "description": "Portatil Lenovo ThinkPad E14 con teclado profesional y alta durabilidad.", "stock_minimo": 4, "stock_actual": 10},
    {"name": "ASUS Vivobook 15 X1504", "sku": "TEC-LTP-004", "description": "Portatil ASUS Vivobook 15 para oficina y uso diario.", "stock_minimo": 5, "stock_actual": 14},
    {"name": "Acer Aspire 5 A515-58", "sku": "TEC-LTP-005", "description": "Portatil Acer Aspire 5 con pantalla Full HD de 15.6 pulgadas.", "stock_minimo": 5, "stock_actual": 13},
    {"name": "Apple MacBook Air 13 M3", "sku": "TEC-LTP-006", "description": "Portatil Apple MacBook Air 13 con chip M3 y almacenamiento SSD.", "stock_minimo": 2, "stock_actual": 6},
    {"name": "MSI Modern 14 C13M", "sku": "TEC-LTP-007", "description": "Portatil MSI Modern 14 para tareas de oficina y estudio.", "stock_minimo": 3, "stock_actual": 8},
    {"name": "Huawei MateBook D16", "sku": "TEC-LTP-008", "description": "Portatil Huawei MateBook D16 con pantalla de 16 pulgadas y perfil delgado.", "stock_minimo": 3, "stock_actual": 8},
    {"name": "Apple iPad 10a Gen 64GB", "sku": "TEC-TAB-001", "description": "Tablet Apple iPad de 10a generacion con pantalla de 10.9 pulgadas.", "stock_minimo": 4, "stock_actual": 12},
    {"name": "Samsung Galaxy Tab S9 FE 128GB", "sku": "TEC-TAB-002", "description": "Tablet Samsung Galaxy Tab S9 FE con S Pen y pantalla de 10.9 pulgadas.", "stock_minimo": 4, "stock_actual": 11},
    {"name": "Lenovo Tab P12 128GB", "sku": "TEC-TAB-003", "description": "Tablet Lenovo Tab P12 enfocada en productividad y multimedia.", "stock_minimo": 3, "stock_actual": 9},
    {"name": "Xiaomi Pad 6 128GB", "sku": "TEC-TAB-004", "description": "Tablet Xiaomi Pad 6 con pantalla de alta tasa de refresco.", "stock_minimo": 3, "stock_actual": 9},
    {"name": "Apple AirPods Pro 2", "sku": "TEC-AUD-001", "description": "Audifonos inalambricos Apple AirPods Pro de segunda generacion.", "stock_minimo": 12, "stock_actual": 36},
    {"name": "Samsung Galaxy Buds FE", "sku": "TEC-AUD-002", "description": "Audifonos inalambricos Samsung Galaxy Buds FE con cancelacion activa.", "stock_minimo": 10, "stock_actual": 30},
    {"name": "Sony WH-1000XM5", "sku": "TEC-AUD-003", "description": "Audifonos Sony de diadema con cancelacion de ruido premium.", "stock_minimo": 4, "stock_actual": 10},
    {"name": "JBL Flip 6", "sku": "TEC-AUD-004", "description": "Parlante Bluetooth JBL Flip 6 resistente al agua.", "stock_minimo": 6, "stock_actual": 18},
    {"name": "Apple Watch SE 2", "sku": "TEC-WEA-001", "description": "Reloj inteligente Apple Watch SE de segunda generacion.", "stock_minimo": 5, "stock_actual": 12},
    {"name": "Samsung Galaxy Watch6 44mm", "sku": "TEC-WEA-002", "description": "Reloj inteligente Samsung Galaxy Watch6 para salud y deporte.", "stock_minimo": 5, "stock_actual": 13},
    {"name": "Logitech MX Master 3S", "sku": "TEC-MOU-001", "description": "Mouse inalambrico Logitech MX Master 3S para productividad.", "stock_minimo": 10, "stock_actual": 28},
    {"name": "Logitech Signature M650", "sku": "TEC-MOU-002", "description": "Mouse inalambrico Logitech Signature M650 de uso diario.", "stock_minimo": 12, "stock_actual": 34},
    {"name": "Razer DeathAdder V3", "sku": "TEC-MOU-003", "description": "Mouse gamer Razer DeathAdder V3 con sensor optico de alta precision.", "stock_minimo": 7, "stock_actual": 20},
    {"name": "Logitech K380", "sku": "TEC-KEY-001", "description": "Teclado Bluetooth Logitech K380 compacto multidispositivo.", "stock_minimo": 10, "stock_actual": 30},
    {"name": "Keychron K2 V2", "sku": "TEC-KEY-002", "description": "Teclado mecanico Keychron K2 V2 con conexion inalambrica.", "stock_minimo": 6, "stock_actual": 16},
    {"name": "HP 230 Wireless Keyboard", "sku": "TEC-KEY-003", "description": "Teclado inalambrico HP 230 para oficina.", "stock_minimo": 9, "stock_actual": 26},
    {"name": "Logitech C920 HD Pro", "sku": "TEC-CAM-001", "description": "Webcam Logitech C920 HD Pro para videollamadas en Full HD.", "stock_minimo": 8, "stock_actual": 22},
    {"name": "Anker PowerConf C200", "sku": "TEC-CAM-002", "description": "Webcam Anker PowerConf C200 con resolucion 2K.", "stock_minimo": 5, "stock_actual": 14},
    {"name": "Dell P2422H 24in", "sku": "TEC-MON-001", "description": "Monitor Dell de 24 pulgadas Full HD para trabajo de oficina.", "stock_minimo": 6, "stock_actual": 15},
    {"name": "LG 27UP650-W 27in 4K", "sku": "TEC-MON-002", "description": "Monitor LG 27 pulgadas 4K UHD orientado a diseno y productividad.", "stock_minimo": 4, "stock_actual": 10},
    {"name": "Samsung Odyssey G5 27in", "sku": "TEC-MON-003", "description": "Monitor Samsung Odyssey G5 para gaming y alto rendimiento.", "stock_minimo": 4, "stock_actual": 11},
    {"name": "BenQ GW2480 24in", "sku": "TEC-MON-004", "description": "Monitor BenQ GW2480 de 24 pulgadas para oficinas y puntos de atencion.", "stock_minimo": 6, "stock_actual": 18},
    {"name": "TP-Link Archer AX55", "sku": "TEC-NET-001", "description": "Router TP-Link Archer AX55 Wi-Fi 6 de doble banda.", "stock_minimo": 8, "stock_actual": 22},
    {"name": "Ubiquiti UniFi 6 Lite", "sku": "TEC-NET-002", "description": "Punto de acceso Ubiquiti UniFi 6 Lite para redes empresariales.", "stock_minimo": 5, "stock_actual": 13},
    {"name": "MikroTik hAP ax3", "sku": "TEC-NET-003", "description": "Router MikroTik hAP ax3 con capacidades avanzadas de red.", "stock_minimo": 4, "stock_actual": 10},
    {"name": "TP-Link TL-SG1024DE", "sku": "TEC-NET-004", "description": "Switch gestionable TP-Link de 24 puertos Gigabit.", "stock_minimo": 4, "stock_actual": 11},
    {"name": "Synology DiskStation DS224+", "sku": "TEC-NAS-001", "description": "Servidor NAS Synology DS224+ de 2 bahias para respaldo y archivos.", "stock_minimo": 2, "stock_actual": 5},
    {"name": "Seagate IronWolf 4TB", "sku": "TEC-HDD-001", "description": "Disco duro Seagate IronWolf 4TB optimizado para NAS.", "stock_minimo": 6, "stock_actual": 17},
    {"name": "WD Blue SN580 1TB NVMe", "sku": "TEC-SSD-001", "description": "SSD NVMe WD Blue SN580 de 1TB para equipos de alto rendimiento.", "stock_minimo": 12, "stock_actual": 35},
    {"name": "Samsung 990 EVO 1TB", "sku": "TEC-SSD-002", "description": "SSD Samsung 990 EVO 1TB para actualizacion de portatiles y PCs.", "stock_minimo": 9, "stock_actual": 26},
    {"name": "Kingston A400 480GB", "sku": "TEC-SSD-003", "description": "SSD SATA Kingston A400 de 480GB para reemplazo de discos mecanicos.", "stock_minimo": 14, "stock_actual": 40},
    {"name": "Corsair Vengeance DDR5 16GB", "sku": "TEC-RAM-001", "description": "Memoria RAM Corsair Vengeance DDR5 de 16GB.", "stock_minimo": 8, "stock_actual": 23},
    {"name": "Epson EcoTank L3250", "sku": "TEC-PRI-001", "description": "Impresora multifuncional Epson EcoTank L3250 con sistema de tinta continuo.", "stock_minimo": 5, "stock_actual": 12},
    {"name": "HP LaserJet Pro MFP 4103fdw", "sku": "TEC-PRI-002", "description": "Impresora multifuncional laser HP LaserJet Pro MFP 4103fdw.", "stock_minimo": 3, "stock_actual": 8},
    {"name": "APC Easy UPS BVX1200LI-LM", "sku": "TEC-UPS-001", "description": "UPS APC Easy UPS BVX1200LI-LM para proteccion de energia.", "stock_minimo": 6, "stock_actual": 16},
    {"name": "Tripp Lite Isobar 6", "sku": "TEC-POW-001", "description": "Supresor de picos Tripp Lite Isobar de 6 tomas.", "stock_minimo": 10, "stock_actual": 28},
]


class Command(BaseCommand):
    help = "Carga 50 productos tecnologicos reales para una empresa especifica"

    CATEGORY_BY_SKU_PREFIX: ClassVar[dict[str, str]] = {
        "PHN": "celular",
        "LTP": "laptop",
        "TAB": "tablet",
        "AUD": "audio",
        "WEA": "wearable",
        "MOU": "mouse",
        "KEY": "teclado",
        "CAM": "camara",
        "MON": "monitor",
        "NET": "red",
        "NAS": "almacenamiento",
        "HDD": "almacenamiento",
        "SSD": "almacenamiento",
        "RAM": "memoria",
        "PRI": "impresora",
        "UPS": "energia",
        "POW": "energia",
    }

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--company-slug",
            default="all-technology",
            help="Slug de la empresa destino (default: all-technology)",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Elimina productos existentes de la empresa antes de cargar el catalogo",
        )

    def resolve_category(self, sku: str) -> str:
        parts = sku.split("-")
        if len(parts) < 2:
            return "otros"
        return self.CATEGORY_BY_SKU_PREFIX.get(parts[1], "otros")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        company_slug = options["company_slug"].strip().lower()
        replace = bool(options["replace"])

        company = Company.objects.filter(slug=company_slug, is_active=True).first()
        if not company:
            raise CommandError(f"No existe una empresa activa con slug '{company_slug}'.")

        if replace:
            deleted_count, _ = Product.objects.filter(company=company).delete()
            self.stdout.write(self.style.WARNING(f"Productos eliminados antes de cargar: {deleted_count}"))

        created = 0
        updated = 0

        for index, payload in enumerate(PRODUCTS, start=1):
            barcode = f"77090000{index:04d}"
            qr_code = f"QR-{payload['sku']}"

            product, was_created = Product.objects.update_or_create(
                company=company,
                sku=payload["sku"],
                defaults={
                    "name": payload["name"],
                    "category": self.resolve_category(payload["sku"]),
                    "barcode": barcode,
                    "qr_code": qr_code,
                    "description": payload["description"],
                    "unit": "unidad",
                    "stock_minimo": payload["stock_minimo"],
                    "stock_actual": payload["stock_actual"],
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        total_company_products = Product.objects.filter(company=company).count()
        self.stdout.write(self.style.SUCCESS(f"Empresa: {company.name} ({company.slug})"))
        self.stdout.write(self.style.SUCCESS(f"Productos creados: {created}"))
        self.stdout.write(self.style.SUCCESS(f"Productos actualizados: {updated}"))
        self.stdout.write(self.style.SUCCESS(f"Total de productos en la empresa: {total_company_products}"))