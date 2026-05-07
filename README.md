# Sistema de Inventario y Trazabilidad

Sistema web para gestion de inventario, trazabilidad y analitica operativa para PYMEs. El proyecto fue desarrollado con Django REST Framework en el backend y Next.js en el frontend, con soporte multiempresa, control de roles, reportes exportables y despliegue en la nube.

## Resumen

- Backend: Django 5 + DRF + JWT + PostgreSQL/Supabase
- Frontend: Next.js 16 + React + TypeScript
- Despliegue: Render para backend y Vercel para frontend
- Arquitectura: multi-tenant por empresa con aislamiento de datos
- Estado: funcional para operaciones de inventario, CRM, alertas, metricas, auditoria y reportes

## Funcionalidades Principales

### Autenticacion y seguridad

- Inicio de sesion con JWT y refresh token
- Roles `Admin` y `Usuario`
- Rutas protegidas en frontend
- Aislamiento de informacion por empresa
- Cambio obligatorio de contrasena para cuentas iniciales

### Inventario

- CRUD de productos
- Entradas, salidas y ajustes con trazabilidad
- Campos por producto:
  - nombre
  - categoria
  - SKU
  - codigo de barras
  - codigo QR
  - unidad de medida
  - stock actual
  - stock minimo
  - stock maximo
  - fecha de compra
  - fecha de vencimiento o garantia segun el tipo de empresa
- Importacion de productos por CSV

### CRM

- CRUD de clientes
- CRUD de proveedores
- Importacion por CSV

### Alertas y control

- Alertas de stock bajo
- Dashboard con metricas en tiempo real
- Auditoria de acciones relevantes

### Reportes

- Existencias actuales
- Productos con bajo stock
- Movimientos por rango de fechas
- Entradas por proveedor
- Salidas por cliente
- Top 10 productos mas vendidos
- Exportacion de reportes a CSV

## Estructura General

```text
SistemaInventarioV2/
├── backend/
│   ├── accounts/      Autenticacion, empresas y tenancy
│   ├── inventory/     Productos y movimientos
│   ├── crm/           Clientes y proveedores
│   ├── alerts/        Alertas operativas
│   ├── audit/         Auditoria de acciones
│   ├── reports/       Reportes y exportacion CSV
│   ├── metrics/       Indicadores del dashboard
│   ├── config/        Settings y rutas Django
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/app/       Rutas App Router
│   ├── src/components/
│   ├── src/lib/
│   └── package.json
├── README.md
├── SETUP.md
└── ARQUITECTURA.md
```

## Requisitos

- Python 3.11+
- Node.js 18+
- npm
- Base de datos PostgreSQL o SQLite para desarrollo local

## Ejecucion Local

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

Backend disponible en `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en `http://localhost:3000`

## Variables de Entorno

### Backend

Variables comunes:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DATABASE_URL`
- `DB_SSL_REQUIRE`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

### Frontend

- `NEXT_PUBLIC_API_URL`

### Autenticacion

- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`
- `GET /api/auth/companies/`
- `POST /api/auth/companies/create/`
- `POST /api/auth/change-password/`

### Inventario

- `GET /api/inventory/products/`
- `POST /api/inventory/products/`
- `PATCH /api/inventory/products/{id}/`
- `POST /api/inventory/products/import_file/`
- `GET /api/inventory/movements/`
- `POST /api/inventory/movements/`

### CRM

- `GET /api/crm/customers/`
- `GET /api/crm/suppliers/`

### Reportes

- `GET /api/reports/current-stock/`
- `GET /api/reports/low-stock/`
- `GET /api/reports/movements/?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/reports/entries-by-supplier/`
- `GET /api/reports/exits-by-customer/`
- `GET /api/reports/top-products/`
- Exportacion CSV: agregar `?export=csv`

## Despliegue

### Backend en Render

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command:

```bash
python manage.py migrate --noinput && python -m gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

### Frontend en Vercel

- Root Directory: `frontend`
- Variable requerida:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

## Documentos Complementarios

- Ver [SETUP.md](c:/Users/000340182/OneDrive%20-%20UPB/Documents/SistemaInventarioV2/SETUP.md) para instalacion y despliegue paso a paso.
- Ver [ARQUITECTURA.md](c:/Users/000340182/OneDrive%20-%20UPB/Documents/SistemaInventarioV2/ARQUITECTURA.md) para la explicacion tecnica del sistema.

## Estado del Proyecto

El proyecto incluye implementacion funcional de inventario, CRM, dashboard, reportes, exportacion CSV, multiempresa, validaciones de negocio por tipo de empresa y datos iniciales de prueba para companias ya creadas.
