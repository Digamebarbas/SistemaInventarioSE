#!/usr/bin/env python
"""
Script para cargar datos iniciales desde CSVs a la base de datos.
Utiliza los endpoints de la API Django.

Uso:
    python load_data.py
"""

import os
import sys
import django
import csv
import json
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, str(Path(__file__).parent))
django.setup()

from django.contrib.auth.models import User, Group
from inventory.models import Product
from crm.models import Customer, Supplier

def get_admin_user():
    """Get or create admin user for authentication."""
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✓ Admin user created")
    return admin_user

def load_products(csv_path):
    """Load products from CSV."""
    print("\n📦 Loading Products...")
    loaded = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            product, created = Product.objects.get_or_create(
                sku=row['SKU'],
                defaults={
                    'name': row['Nombre'],
                    'barcode': row['Codigo_de_barras'],
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
    
    print(f"✓ Loaded {loaded} products")

def load_suppliers(csv_path):
    """Load suppliers from CSV."""
    print("\n🏢 Loading Suppliers...")
    loaded = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            supplier, created = Supplier.objects.get_or_create(
                name=row['Nombre'],
                defaults={
                    'email': row['Email'],
                    'phone': row['Telefono'],
                    'address': row['Direccion'],
                    'nit': row['NIT'],
                }
            )
            if created:
                loaded += 1
    
    print(f"✓ Loaded {loaded} suppliers")

def load_customers(csv_path):
    """Load customers from CSV."""
    print("\n👤 Loading Customers...")
    loaded = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            customer, created = Customer.objects.get_or_create(
                name=row['Nombre'],
                defaults={
                    'email': row['Email'],
                    'phone': row['Telefono'],
                    'address': row['Direccion'],
                    'nit_cedula': row['NIT_Cedula'],
                }
            )
            if created:
                loaded += 1
    
    print(f"✓ Loaded {loaded} customers")

def main():
    """Main function."""
    print("=" * 50)
    print("Cargando datos iniciales del inventario...")
    print("=" * 50)
    
    # Ensure admin user exists
    get_admin_user()
    
    # Get paths
    base_dir = Path(__file__).parent
    products_csv = base_dir / 'data' / 'productos_bodega.csv'
    suppliers_csv = base_dir / 'data' / 'proveedores.csv'
    customers_csv = base_dir / 'data' / 'clientes.csv'
    
    # Load data
    try:
        if products_csv.exists():
            load_products(products_csv)
        else:
            print(f"⚠ Products CSV not found: {products_csv}")
        
        if suppliers_csv.exists():
            load_suppliers(suppliers_csv)
        else:
            print(f"⚠ Suppliers CSV not found: {suppliers_csv}")
        
        if customers_csv.exists():
            load_customers(customers_csv)
        else:
            print(f"⚠ Customers CSV not found: {customers_csv}")
        
        print("\n" + "=" * 50)
        print("✓ Datos cargados exitosamente!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
