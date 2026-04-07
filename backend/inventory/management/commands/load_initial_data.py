from django.core.management.base import BaseCommand
import csv
from pathlib import Path
from accounts.models import Company
from inventory.models import Product
from crm.models import Customer, Supplier


class Command(BaseCommand):
    help = 'Cargar datos iniciales desde CSVs'

    def get_default_company(self):
        company, _ = Company.objects.get_or_create(
            slug="all-technology",
            defaults={"name": "All Technology", "is_active": True},
        )
        return company

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 50))
        self.stdout.write(self.style.SUCCESS('Cargando datos iniciales del inventario...'))
        self.stdout.write(self.style.SUCCESS('=' * 50 + '\n'))

        base_dir = Path(__file__).parent.parent.parent.parent / 'data'
        
        company = self.get_default_company()

        # Load products
        self.load_products(base_dir / 'productos_bodega.csv', company)
        
        # Load suppliers
        self.load_suppliers(base_dir / 'proveedores.csv', company)
        
        # Load customers
        self.load_customers(base_dir / 'clientes.csv', company)
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 50))
        self.stdout.write(self.style.SUCCESS('✓ Datos cargados exitosamente!'))
        self.stdout.write(self.style.SUCCESS('=' * 50 + '\n'))

    def load_products(self, csv_path, company):
        """Load products from CSV."""
        self.stdout.write(self.style.WARNING('\n📦 Loading Products...'))
        
        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f'✗ archivo no encontrado: {csv_path}'))
            return
        
        loaded = 0
        updated = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sku = row['SKU']
                qr_code = f"QR-{sku}"  # Generate unique QR code from SKU
                
                product, created = Product.objects.get_or_create(
                    company=company,
                    sku=sku,
                    defaults={
                        'name': row['Nombre'],
                        'barcode': row['Codigo_de_barras'],
                        'qr_code': qr_code,
                        'stock_minimo': int(row['Stock_minimo']),
                        'stock_actual': int(row['Stock_inicial']),
                    }
                )
                if created:
                    loaded += 1
                else:
                    # Update stock if product exists
                    product.stock_actual = int(row['Stock_inicial'])
                    product.save()
                    updated += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Loaded {loaded} new products, updated {updated}'))

    def load_suppliers(self, csv_path, company):
        """Load suppliers from CSV."""
        self.stdout.write(self.style.WARNING('\n🏢 Loading Suppliers...'))
        
        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f'✗ archivo no encontrado: {csv_path}'))
            return
        
        loaded = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                supplier, created = Supplier.objects.get_or_create(
                    company=company,
                    name=row['Nombre'],
                    defaults={
                        'email': row['Email'],
                        'phone': row['Telefono'],
                        'address': row['Direccion'],
                        'tax_id': row['NIT'],
                    }
                )
                if created:
                    loaded += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Loaded {loaded} suppliers'))

    def load_customers(self, csv_path, company):
        """Load customers from CSV."""
        self.stdout.write(self.style.WARNING('\n👤 Loading Customers...'))
        
        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f'✗ archivo no encontrado: {csv_path}'))
            return
        
        loaded = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                customer, created = Customer.objects.get_or_create(
                    company=company,
                    name=row['Nombre'],
                    defaults={
                        'email': row['Email'],
                        'phone': row['Telefono'],
                        'address': row['Direccion'],
                        'tax_id': row['NIT_Cedula'],
                    }
                )
                if created:
                    loaded += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Loaded {loaded} customers'))
