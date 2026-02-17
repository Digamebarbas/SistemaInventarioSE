# Guía Rápida de Inicio

## Pre-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL (opcional, usará SQLite por defecto)

## Iniciar el Sistema

### Opción 1: Scripts de inicio rápido (Recomendado)

**Windows:**
```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend
start-frontend.bat
```

**Linux/Mac:**
```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

### Opción 2: Comandos manuales

#### 1. Backend (Django)

**Windows:**
```bash
cd backend
..\.venv\Scripts\python.exe manage.py runserver
```

**Linux/Mac:**
```bash
cd backend
../.venv/bin/python manage.py runserver
```

El backend estará disponible en: `http://localhost:8000`

**Admin Panel:** `http://localhost:8000/admin/`
- Usuario: `admin`
- Contraseña: `admin123`

#### 2. Frontend (Next.js)

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

## Credenciales de Prueba

- **Usuario:** admin
- **Contraseña:** admin123

## Endpoints Principales

### Autenticación
- `POST /api/auth/token/` - Login
- `POST /api/auth/register/` - Registro
- `GET /api/auth/me/` - Usuario actual

### Inventario
- `GET /api/inventory/products/` - Lista de productos
- `GET /api/inventory/movements/` - Movimientos

### Reportes
- `GET /api/reports/current-stock/` - Existencias
- `GET /api/reports/low-stock/` - Stock bajo
- `GET /api/reports/top-products/` - Top productos

### Métricas
- `GET /api/metrics/dashboard/` - Dashboard metrics

## Estructura de Carpetas

```
SistemaInventarioV2/
├── backend/           # Django + DRF API
├── frontend/          # Next.js App
└── README.md          # Documentación completa
```

## Despliegue

Ver [README.md](README.md) para instrucciones detalladas de despliegue en:
- Backend: Render / Railway
- Frontend: Vercel
- Base de datos: PostgreSQL en la nube

## Soporte

Revisa el [README.md](README.md) principal para documentación completa sobre:
- Arquitectura del sistema
- Modelos de datos
- Endpoints API
- Configuración de producción
- Variables de entorno

## Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'django'"

**Solución:** Usa el Python del entorno virtual:
- Windows: `..\.venv\Scripts\python.exe manage.py runserver`
- Linux/Mac: `../.venv/bin/python manage.py runserver`
- O ejecuta: `start-backend.bat` (Windows) / `./start-backend.sh` (Linux/Mac)

### El frontend no se conecta al backend

**Solución:** Verifica que:
1. El backend esté corriendo en `http://localhost:8000`
2. El archivo `frontend/.env.local` tenga: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
3. No haya errores CORS (revisa la consola del navegador)

### Error de CORS

**Solución:** Verifica que en `backend/config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```
