# Sistema de Inventario y Trazabilidad

Sistema digital de inventarios y trazabilidad para PYMEs, desarrollado con **Django + DRF** (backend) y **Next.js + React** (frontend).

## Características

### Backend (Django + DRF + PostgreSQL)
- ✅ Autenticación JWT con refresh token
- ✅ RBAC (roles Admin y Usuario) con permisos diferenciados
- ✅ Gestión de productos con soporte a código de barras/QR
- ✅ Control automático de stock (entradas, salidas y ajustes)
- ✅ Trazabilidad completa de movimientos
- ✅ CRUD de clientes y proveedores
- ✅ Alertas automáticas de stock bajo
- ✅ 6 reportes principales:
  - Existencias actuales
  - Productos con bajo stock
  - Movimientos por rango de fechas
  - Entradas por proveedor
  - Salidas por cliente
  - Top 10 productos más vendidos
- ✅ Métricas en tiempo real para el dashboard
- ✅ Auditoría completa (logs inmutables de creación, actualización, eliminación)
- ✅ Configuración CORS para integración con Vercel

### Frontend (Next.js + React + TypeScript)
- ✅ Autenticación JWT con interceptor de axios
- ✅ Rutas protegidas mediante HOC
- ✅ Dashboard con métricas en tiempo real
- ✅ Página de login responsiva
- ✅ Preparado para despliegue en Vercel

## Estructura del Proyecto

```
SistemaInventarioV2/
├── backend/
│   ├── config/           # Configuración principal Django
│   ├── accounts/         # Autenticación y roles (JWT)
│   ├── inventory/        # Productos y movimientos
│   ├── crm/              # Clientes y proveedores
│   ├── alerts/           # Alertas de stock
│   ├── audit/            # Logs de auditoría
│   ├── reports/          # 6 reportes principales
│   ├── metrics/          # Dashboard y métricas
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/       # Página de login
    │   │   ├── dashboard/   # Dashboard con métricas
    │   │   └── page.tsx     # Redirige a /login
    │   ├── components/
    │   │   └── ProtectedRoute.tsx  # HOC para rutas protegidas
    │   └── lib/
    │       └── api.ts       # Cliente axios con JWT refresh
    ├── package.json
    └── .env.local
```

## Pre-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (o SQLite para desarrollo local)

## Instalación y Configuración

### Backend

1. **Crear entorno virtual y activarlo:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Linux/Mac
   ```

2. **Instalar dependencias:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configurar variables de entorno:**
   - Copiar `backend/.env.example` a `backend/.env`
   - Editar los valores según tu configuración local o producción

4. **Aplicar migraciones:**
   ```bash
   python backend/manage.py makemigrations
   python backend/manage.py migrate
   ```

5. **Crear superusuario:**
   ```bash
   python backend/manage.py createsuperuser
   ```

6. **Correr servidor de desarrollo:**
   ```bash
   python backend/manage.py runserver
   ```

   El backend estará en `http://localhost:8000`

### Frontend

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno:**
   - Copiar `frontend/.env.local` (ya creado)
   - Asegurar que `NEXT_PUBLIC_API_URL` apunte al backend

3. **Correr servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   El frontend estará en `http://localhost:3000`

## Uso

1. Accede a `http://localhost:3000` (redirige a `/login`)
2. Inicia sesión con el superusuario creado
3. Explora el dashboard con métricas en tiempo real
4. Administra productos, clientes, proveedores, movimientos, alertas y reportes desde la API

## Endpoints principales

### Autenticación
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/token/` - Login (obtener access y refresh token)
- `POST /api/auth/token/refresh/` - Refrescar access token
- `GET /api/auth/me/` - Obtener datos del usuario actual

### Inventario
- `GET/POST/PUT/DELETE /api/inventory/products/` - CRUD de productos
- `GET/POST /api/inventory/movements/` - Movimientos (entradas, salidas, ajustes)

### CRM
- `GET/POST/PUT/DELETE /api/crm/customers/` - CRUD de clientes
- `GET/POST/PUT/DELETE /api/crm/suppliers/` - CRUD de proveedores

### Alertas
- `GET /api/alerts/` - Consultar alertas de stock bajo
- `PATCH /api/alerts/{id}/resolve/` - Marcar alerta como resuelta

### Reportes
- `GET /api/reports/current-stock/` - Existencias actuales
- `GET /api/reports/low-stock/` - Productos con bajo stock
- `GET /api/reports/movements/?start=YYYY-MM-DD&end=YYYY-MM-DD` - Movimientos por rango
- `GET /api/reports/entries-by-supplier/` - Entradas por proveedor
- `GET /api/reports/exits-by-customer/` - Salidas por cliente
- `GET /api/reports/top-products/` - Top 10 productos más vendidos

### Métricas
- `GET /api/metrics/dashboard/` - Dashboard con métricas en tiempo real

## Despliegue

### Backend (Render, Railway, etc.)

1. Crear servicio PostgreSQL en tu plataforma de despliegue
2. Configurar las variables de entorno en el panel de tu servicio:
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS=tu-dominio.onrender.com`
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
   - `CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app`
   - `CSRF_TRUSTED_ORIGINS=https://tu-frontend.vercel.app`
3. Desplegar el código del directorio `backend/`
4. Ejecutar migraciones y crear superusuario desde el shell remoto

### Frontend (Vercel)

1. Conectar el repositorio a Vercel
2. Configurar el directorio raíz como `frontend/`
3. Agregar la variable de entorno:
   - `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com/api`
4. Desplegar

## Tecnologías

- **Backend:** Django 5.2, Django REST Framework, djangorestframework-simplejwt, django-cors-headers, psycopg2-binary
- **Frontend:** Next.js 16, React, TypeScript, TailwindCSS, Axios
- **Base de datos:** PostgreSQL (o SQLite para desarrollo local)

## Mejoras Futuras (Opcionales)

- Integración de WebSockets (Django Channels) para actualización en tiempo real
- Lector de código QR/barras en el frontend usando librerías de escaneo
- Expandir reportes y gráficas usando bibliotecas de visualización (Chart.js, Recharts)
- Notificaciones por email/SMS cuando se active una alerta
- Autenticación con OAuth2 (Google, Microsoft)
- Fecha de compra
- Fecha de garantía
- Stock Maximo
- Unidades de Medidad (Segun Cliente)
- Top 10 productos más vendidos por temporada (fecha)

## Licencia

Este proyecto es de uso interno para PYMEs y está provisto "tal cual" sin garantías.

---

Desarrollado por: [Tu Nombre]  
Fecha: Febrero 2026
