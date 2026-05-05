# Guía de Instalación y Configuración

## Preparación del Proyecto

### Base de Datos Limpia
La base de datos está lista para desarrollo. No hay datos de demostración cargados.

### Requisitos Previos

- **Python 3.11+**
- **Node.js 18+**
- **pip** (gestor de paquetes Python)
- **npm** (gestor de paquetes Node.js)

---

## Instalación Paso a Paso

### 1. Backend (Django + DRF)

#### 1.1 Crear y activar entorno virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python -m venv .venv
source .venv/bin/activate
```

#### 1.2 Instalar dependencias

```bash
pip install -r backend/requirements.txt
```

#### 1.3 Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y configurar si es necesario:

```env
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

#### 1.4 Aplicar migraciones

```bash
cd backend
python manage.py migrate
```

#### 1.5 Crear usuario administrativo

```bash
python manage.py createsuperuser
```

Responde a las preguntas interactivas. Ejemplo:
- Usuario: `admin`
- Email: `admin@example.com`
- Contraseña: `admin123`

#### 1.6 Ejecutar servidor

```bash
python manage.py runserver
```

El backend estará disponible en **http://localhost:8000**

---

### 2. Frontend (Next.js + React)

#### 2.1 Instalar dependencias

```bash
cd frontend
npm install
```

#### 2.2 Variables de entorno

El archivo `.env.local` ya está configurado. Verificar que contenga:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### 2.3 Ejecutar servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en **http://localhost:3000**

---

## Flujo de Uso Inicial

1. **Accede a http://localhost:3000**
   - Se redirige automáticamente a `/login`

2. **Inicia sesión con tus credenciales**
   - Usuario: `admin`
   - Contraseña: `admin123` (o la que creaste)

3. **Primera vez que accedes**
   - Se te pedirá cambiar la contraseña obligatoriamente
   - Esto es por seguridad (todas las nuevas cuentas requieren cambio en primer login)

4. **Después del cambio de contraseña**
   - Accedes al onboarding donde puedes crear tu primera empresa
   - Selecciona una categoría de inventario (General, Alimentos, Electrónicos, etc.)
   - ¡Comienza a usar el sistema!

---

## Estructura de Carpetas

```
backend/
├── config/              # Configuración central Django
│   ├── settings.py      # Configuración del proyecto
│   ├── urls.py          # Rutas principales
│   ├── permissions.py   # Permisos personalizados
│   └── wsgi.py
├── accounts/            # Autenticación y gestión de usuarios
│   ├── models.py        # Modelos User, Company, UserCompany
│   ├── views.py         # Vistas de autenticación
│   ├── serializers.py   # Serializadores JWT
│   └── tenancy.py       # Lógica multi-tenant
├── inventory/           # Gestión de inventario
│   ├── models.py        # Product, InventoryMovement
│   └── views.py         # ProductViewSet, MovementViewSet
├── crm/                 # Clientes y proveedores
│   ├── models.py        # Customer, Supplier
│   └── views.py         # CSVImporter integrado
├── alerts/              # Sistema de alertas
├── audit/               # Auditoría y logs
├── reports/             # Reportes
├── metrics/             # Métricas del dashboard
├── manage.py
├── requirements.txt     # Dependencias Python
└── db.sqlite3           # BD (desarrollo local)

frontend/
├── src/
│   ├── app/
│   │   ├── login/           # Página de autenticación
│   │   ├── dashboard/       # Dashboard con métricas
│   │   ├── cambiar-contrasena/  # Cambio obligatorio de PWD
│   │   ├── configuracion-inicial/   # Onboarding
│   │   ├── clientes/        # CRUD + importación CSV
│   │   ├── proveedores/     # CRUD + importación CSV
│   │   ├── productos/       # CRUD de productos
│   │   ├── movimientos/     # Movimientos de inventario
│   │   ├── alertas/         # Alertas de stock
│   │   ├── reportes/        # Reportes
│   │   └── usuarios/        # Gestión de usuarios
│   ├── components/
│   │   ├── CSVImporter.tsx  # Modal para importar CSV
│   │   ├── ProtectedRoute.tsx   # HOC de protección
│   │   ├── Sidebar.tsx      # Navegación
│   │   └── Toast.tsx        # Notificaciones
│   └── lib/
│       ├── api.ts          # Cliente axios con JWT
│       └── useNotification.ts
├── package.json
└── .env.local
```

---

## APIs Principales

### Autenticación

```
POST   /api/auth/token/              → Login (obtener JWT)
POST   /api/auth/token/refresh/      → Refrescar token
POST   /api/auth/change-password/    → Cambiar contraseña
POST   /api/auth/companies/create/   → Crear empresa (onboarding)
GET    /api/auth/me/                 → Usuario actual
```

### Inventario

```
GET    /api/inventory/products/                 → Listar productos
POST   /api/inventory/products/                 → Crear producto
PUT    /api/inventory/products/{id}/            → Actualizar
DELETE /api/inventory/products/{id}/            → Eliminar
POST   /api/inventory/products/import_csv/      → Importar CSV

GET    /api/inventory/movements/                → Listar movimientos
POST   /api/inventory/movements/                → Crear movimiento
```

### CRM

```
GET    /api/crm/customers/                     → Listar clientes
POST   /api/crm/customers/                     → Crear cliente
POST   /api/crm/customers/import_csv/          → Importar CSV clientes

GET    /api/crm/suppliers/                     → Listar proveedores
POST   /api/crm/suppliers/                     → Crear proveedor
POST   /api/crm/suppliers/import_csv/          → Importar CSV proveedores
```

### Reportes

```
GET    /api/reports/existencias/               → Reporte de existencias
GET    /api/reports/bajo-stock/                → Productos con bajo stock
GET    /api/reports/movimientos/               → Movimientos por rango
GET    /api/reports/entradas-proveedor/        → Entradas por proveedor
GET    /api/reports/salidas-cliente/           → Salidas por cliente
GET    /api/reports/top-productos/             → Top 10 productos
```

---

## Buenas Prácticas Implementadas

### Backend
- ✅ **Autenticación JWT**: Segura y stateless
- ✅ **Permisos granulares**: RBAC con roles y permisos
- ✅ **Multi-tenant**: Aislamiento de datos por empresa
- ✅ **Validación de datos**: Serializadores con validación
- ✅ **Auditoría**: Logs inmutables de todas las acciones
- ✅ **Manejo de errores**: Respuestas consistentes
- ✅ **Paginación**: En todos los endpoints
- ✅ **Filtrado y búsqueda**: Soporte en listas

### Frontend
- ✅ **Componentes reutilizables**: HOCs, helpers
- ✅ **State management**: React Hooks y Context
- ✅ **Rutas protegidas**: Redireccionamiento automático
- ✅ **Interceptores HTTP**: Manejo de tokens
- ✅ **TypeScript**: Type safety
- ✅ **Responsive design**: Tailwind CSS
- ✅ **Notificaciones**: Sistema de toasts
- ✅ **Variables de entorno**: Configuración segura

---

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
