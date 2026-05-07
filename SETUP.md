# Guia de Instalacion, Configuracion y Despliegue

Este documento describe como ejecutar el sistema en desarrollo local y como desplegarlo en Render y Vercel.

## 1. Requisitos Previos

- Python 3.11 o superior
- Node.js 18 o superior
- npm
- Git
- Cuenta en Supabase si se usara PostgreSQL administrado
- Cuenta en Render para backend
- Cuenta en Vercel para frontend

## 2. Configuracion Local

### 2.1 Backend

Desde la raiz del proyecto:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

Crear o ajustar `backend/.env`.

Ejemplo con SQLite:

```env
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
DB_SSL_REQUIRE=False
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

Ejemplo con Supabase:

```env
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://usuario:password@host:puerto/postgres
DB_SSL_REQUIRE=True
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

Aplicar migraciones:

```bash
cd backend
python manage.py migrate
```

Ejecutar backend:

```bash
python manage.py runserver
```

### 2.2 Frontend

```bash
cd frontend
npm install
```

Crear `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Ejecutar frontend:

```bash
npm run dev
```

## 3. Flujo Inicial de Uso

1. Abrir el frontend en `http://localhost:3000`
2. Iniciar sesion con un usuario valido
3. Seleccionar o crear empresa
4. Gestionar productos, movimientos, clientes y proveedores
5. Consultar reportes y exportarlos a CSV

## 4. Datos y Reglas de Negocio

### Productos

Cada producto puede manejar:

- fecha de compra
- stock minimo
- stock maximo
- fecha de vencimiento o garantia

### Regla por empresa

- Si `uses_warranty_period=True`, el producto usa `periodo_garantia_meses`
- Si `uses_warranty_period=False`, el producto usa `fecha_vencimiento`

No deben usarse ambos campos a la vez.

## 5. Despliegue en Render

### 5.1 Configuracion recomendada

- Service Type: Web Service
- Root Directory: `backend`
- Runtime: Python
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
python manage.py migrate --noinput && python -m gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

### 5.2 Variables de entorno en Render

Configurar al menos:

```env
DJANGO_SECRET_KEY=tu-clave-secreta
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=.onrender.com,tu-servicio.onrender.com
DATABASE_URL=postgresql://...
DB_SSL_REQUIRE=True
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://tu-frontend.vercel.app,https://*.vercel.app
```

Notas:

- Si Render Free no permite usar shell remoto, el `migrate` debe ejecutarse dentro del Start Command.
- Si el frontend usa dominios preview de Vercel, se recomienda permitir `*.vercel.app` por regex desde backend.

## 6. Despliegue en Vercel

- Root Directory: `frontend`
- Framework: Next.js
- Variable requerida:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

Despues de cambiar variables de entorno:

1. guardar
2. redeploy del ultimo deployment

## 7. Validaciones Post-Despliegue

### Backend

Probar:

```text
GET /api/auth/companies/
GET /api/reports/current-stock/
```

### Frontend

Verificar:

- listado de empresas visible en login
- carga de productos
- nuevos campos de productos visibles
- exportacion CSV en reportes

## 8. Problemas Comunes

### No aparecen empresas en login

- revisar `NEXT_PUBLIC_API_URL`
- revisar CORS y CSRF en backend
- revisar que el backend responda `GET /api/auth/companies/`

### Error 400 en Render

- revisar `DJANGO_ALLOWED_HOSTS`
- usar `.onrender.com,tu-servicio.onrender.com`

### Las migraciones no corren en Render Free

- ejecutar migraciones desde el Start Command, no desde shell remoto

### El frontend no refleja cambios

- redeploy en Vercel
- limpiar cache del navegador si persiste una respuesta vieja

## Troubleshooting

### Error: "ConnectionRefusedError" en frontend

**Causa**: Backend no está ejecutándose

**Solución**:
```bash
cd backend
python manage.py runserver
```

### Error: "ModuleNotFoundError" en backend

**Causa**: Dependencias no instaladas

**Solución**:
```bash
pip install -r backend/requirements.txt
```

### Error: "db.sqlite3" no encontrado

**Causa**: Migraciones no aplicadas

**Solución**:
```bash
cd backend
python manage.py migrate
```

---

## Comandos Útiles

```bash
# Backend
python manage.py makemigrations          # Crear migraciones
python manage.py migrate                 # Aplicar migraciones
python manage.py createsuperuser         # Crear usuario admin
python manage.py runserver               # Iniciar servidor

# Frontend
npm install                             # Instalar dependencias
npm run dev                             # Servidor desarrollo
npm run build                           # Build producción
npm run lint                            # Validar código
```

---

## Documentación Completa

Ver [README.md](README.md) para detalles completos del proyecto.
