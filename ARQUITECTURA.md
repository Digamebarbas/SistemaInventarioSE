# Arquitectura del Proyecto

## 1. Vision General

El sistema esta construido como una aplicacion web desacoplada:

```text
Frontend Next.js
  ↓ HTTP/JSON
Backend Django REST Framework
  ↓ ORM
PostgreSQL / SQLite
```

El frontend consume la API REST del backend mediante Axios. El backend aplica autenticacion JWT, permisos, reglas de negocio y persistencia.

## 2. Capas del Sistema

### Frontend

- Implementado con Next.js App Router
- Vistas protegidas por autenticacion
- Cliente HTTP centralizado en `frontend/src/lib/api.ts`
- Formularios y tablas para operacion del sistema
- Exportacion CSV disparada desde endpoints del backend

### Backend

- Django como framework base
- Django REST Framework para API
- Serializers para validacion de datos
- ViewSets y APIViews para exponer operaciones
- ORM para acceso a datos

### Base de datos

- PostgreSQL/Supabase en nube
- SQLite para desarrollo local si se requiere

## 3. Modulos Principales

### accounts

Responsabilidades:

- login JWT
- cambio de contrasena
- empresas
- membresias usuario-empresa
- resolucion de empresa activa

Entidades clave:

- `Company`
- `UserCompany`

Regla importante:

- `Company.uses_warranty_period` define si sus productos usan garantia o vencimiento.

### inventory

Responsabilidades:

- productos
- movimientos de inventario
- importacion CSV
- validaciones de stock

Entidades clave:

- `Product`
- `InventoryMovement`

Campos relevantes en `Product`:

- `stock_minimo`
- `stock_maximo`
- `stock_actual`
- `fecha_compra`
- `fecha_vencimiento`
- `periodo_garantia_meses`

Reglas:

- stock maximo no puede ser negativo
- stock maximo debe ser mayor o igual al stock minimo
- si la empresa maneja garantia, no se permite vencimiento
- si la empresa maneja vencimiento, no se permite garantia

### crm

Responsabilidades:

- clientes
- proveedores
- importacion CSV

### alerts

Responsabilidades:

- alertas de stock bajo

### metrics

Responsabilidades:

- metricas consolidadas para dashboard

### reports

Responsabilidades:

- reportes operativos
- exportacion CSV

Reportes implementados:

- existencias actuales
- bajo stock
- movimientos por rango
- entradas por proveedor
- salidas por cliente
- top productos

### audit

Responsabilidades:

- trazabilidad de acciones relevantes del sistema

## 4. Multiempresa

El sistema trabaja con aislamiento por empresa.

Flujo general:

1. el usuario inicia sesion
2. el token contiene contexto de empresa
3. `get_request_company(request)` resuelve la empresa activa
4. los querysets se filtran por esa empresa

Beneficio:

- un usuario solo opera sobre los datos de la empresa activa

## 5. Flujo de Producto

```text
Usuario crea o edita producto
  ↓
Frontend envia payload a /api/inventory/products/
  ↓
ProductSerializer valida reglas
  ↓
Product se guarda en BD
  ↓
Frontend refresca tabla
```

Para movimientos:

```text
Usuario registra entrada/salida/ajuste
  ↓
InventoryMovementSerializer valida negocio
  ↓
se recalcula stock_actual
  ↓
se crea movimiento historico
  ↓
se revisa alerta de stock
```

## 6. Flujo de Reportes

```text
Usuario selecciona reporte
  ↓
Frontend consulta /api/reports/{reporte}/
  ↓
Backend arma queryset agregado
  ↓
Respuesta JSON para tabla
```

Si se requiere exportar:

```text
/api/reports/{reporte}/?export=csv
  ↓
Backend genera HttpResponse CSV
  ↓
Frontend descarga archivo
```

## 7. Decisiones Tecnicas Relevantes

- JWT para mantener autenticacion stateless
- Multi-tenant por empresa para separar informacion
- DRF serializers para concentrar validaciones de negocio
- Next.js para interfaz moderna y despliegue sencillo en Vercel
- Gunicorn en Render para servir Django en produccion
- Migraciones automaticas al iniciar backend en Render Free

## 8. Despliegue Actual

Arquitectura de despliegue prevista:

```text
Vercel (frontend)
  ↓
Render (backend Django)
  ↓
Supabase PostgreSQL
```

## 9. Escalabilidad y Extension

El sistema puede extenderse con relativa facilidad para:

- nuevas categorias de reportes
- reglas especificas por empresa
- nuevos tipos de alertas
- dashboards especializados
- integraciones con lectores fisicos o ERPs
  const [toasts, setToasts] = useState<Toast[]>([]);

  const success = (message: string) => {
    addToast(message, 'success');
  };

  const error = (message: string) => {
    addToast(message, 'error');
  };

  return { toasts, removeNotification, success, error };
}
```

**Uso**:
```typescript
const { success, error } = useNotification();

try {
  await saveData();
  success("✓ Datos guardados");
} catch {
  error("✗ Error al guardar");
}
```

**Ventaja**: Feedback visual consistente en toda la aplicación.

### 4. Componente CSVImporter Reutilizable

**Archivo**: `components/CSVImporter.tsx`

```typescript
interface ImporterProps {
  endpoint: string;  // Flexible: /crm/customers/ o /crm/suppliers/
  entityName: string;  // "cliente" o "proveedor"
  columns: string[];  // Campos del CSV
  onSuccess: () => void;  // Callback después de importar
}

export default function CSVImporter({ 
  endpoint, 
  entityName, 
  columns, 
  onSuccess 
}: ImporterProps) {
  // Modal con:
  // - Selector de archivo
  // - Descarga de plantilla
  // - Validación
  // - Reportes de éxito/error
}
```

**Uso en múltiples páginas**:
```tsx
// clientes/page.tsx
<CSVImporter 
  endpoint="/crm/customers/" 
  entityName="cliente"
  columns={["name", "email", "phone", "address", "tax_id"]}
  onSuccess={loadCustomers}
/>

// proveedores/page.tsx
<CSVImporter 
  endpoint="/crm/suppliers/"
  entityName="proveedor"
  columns={["name", "email", "phone", "address", "tax_id"]}
  onSuccess={loadSuppliers}
/>
```

**Ventaja**: Una sola implementación para múltiples casos de uso.

### 5. TypeScript para Type Safety

**Ejemplo**:
```typescript
interface Product {
  id: number;
  name: string;
  sku: string;
  stock_actual: number;
  stock_minimo: number;
}

// El compilador previene errores de tipo
const product: Product = { 
  // Error: falta 'id', 'sku', etc.
  name: "Producto"
};
```

**Ventaja**: Errores detectados en compile time, no en runtime.

### 6. Routing Seguro

**Estructura**:
```
app/
├── login/           → Público
├── dashboard/       → Protegido ✨
├── productos/       → Protegido ✨
└── layout.tsx       → Envuelve con ProtectedRoute
```

**Implementación**:
```typescript
// app/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <Sidebar>
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}
```

---

## Seguridad

### 1. Autenticación
- ✅ JWT con refresh token
- ✅ Tokens almacenados en localStorage
- ✅ Renovación automática

### 2. Autorización
- ✅ RBAC (Admin/Usuario)
- ✅ Permisos por endpoint
- ✅ Multi-tenant con aislamiento completo

### 3. Validación
- ✅ Validación en backend (nunca confiar en cliente)
- ✅ Serializers con validación
- ✅ Permisos granulares

### 4. HTTPS
- ✅ Prepare para HTTPS en producción
- ✅ CORS configurado correctamente

---

## Escalabilidad

### 1. Base de Datos
- ✅ Índices en campos frecuentemente consultados
- ✅ Queries optimizadas (select_related, prefetch_related)
- ✅ Paginación obligatoria

### 2. APIs
- ✅ Cacheo con Redis (preparado)
- ✅ Rate limiting (preparado)
- ✅ Compresión GZIP

### 3. Frontend
- ✅ Code splitting automático (Next.js)
- ✅ Lazy loading de componentes
- ✅ Optimización de imágenes

---

## Testing

### Backend
```bash
python manage.py test accounts
```

### Frontend
```bash
npm run test
```

---

## Despliegue

### Backend
- Usar Gunicorn en producción
- Configurar variables de entorno
- Usar PostgreSQL en lugar de SQLite

### Frontend
- Desplegar en Vercel (soportado nativamente)
- Build estático con `npm run build`
- CDN para assets

---

## Próximos Pasos (Fase 2)

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] CI/CD pipeline
- [ ] Documentación Swagger/OpenAPI
- [ ] Caché Redis
- [ ] Rate limiting
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Exportación de reportes en PDF/Excel
