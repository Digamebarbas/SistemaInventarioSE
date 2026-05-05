# Arquitectura y Buenas Prácticas de Código

## Arquitectura General

### Patrón MVC (Modificado para REST API)

El proyecto sigue un patrón adaptado de MVC para APIs REST:

```
Request HTTP
    ↓
[URLRouter] → Ruta la solicitud a la vista
    ↓
[ViewSet/View] → Procesa la lógica de negocio
    ↓
[Serializer] → Valida y transforma datos
    ↓
[Model] → Accede a la base de datos
    ↓
Response JSON
```

---

## Backend - Django REST Framework

### 1. Estructura de Aplicaciones

El proyecto está dividido en aplicaciones especializadas:

```
accounts/   → Autenticación, autorización, multi-tenant
inventory/  → Productos, movimientos de stock
crm/        → Clientes, proveedores
alerts/     → Notificaciones y alertas
audit/      → Trazabilidad y logs inmutables
reports/    → Reportes y análisis
metrics/    → Métricas para dashboard
```

**Ventaja**: Cada aplicación es independiente y reutilizable.

### 2. Autenticación JWT

**Archivo**: `accounts/serializers.py`

```python
class CompanyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Agregar datos personalizados al token
        token['company_id'] = user.usercompany_set.first().company_id
        token['is_admin'] = user.groups.filter(name='Admin').exists()
        return token
```

**Ventaja**: Los datos del usuario viajan en el token, eliminando consultas a BD.

### 3. Permisos y Autorizaciones

**Archivo**: `config/permissions.py`

```python
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.groups.filter(name='Admin').exists()
```

**Ventaja**: Control granular de acceso a resources sin sobrecargar las vistas.

### 4. Multi-Tenancy

**Archivo**: `accounts/tenancy.py`

```python
def get_request_company(request) -> Optional[Company]:
    """Obtiene la empresa del usuario desde el token JWT"""
    user = getattr(request, 'user', None)
    token = getattr(request, 'auth', None)
    
    if token:
        company_id = token.get('company_id')
        return Company.objects.get(id=company_id)
    return get_default_company_for_user(user)
```

**Uso en ViewSet**:
```python
def get_queryset(self):
    company = get_request_company(self.request)
    return Product.objects.filter(company=company)
```

**Ventaja**: 
- Datos completamente aislados por empresa
- Seguridad: Un usuario solo ve sus propios datos
- Escalabilidad: Fácil agregar más empresas

### 5. Serializers con Validación

**Archivo**: `crm/serializers.py`

```python
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 'tax_id']
    
    def validate_email(self, value):
        if '@' not in value:
            raise serializers.ValidationError("Email inválido")
        return value
```

**Ventaja**: 
- Validación automática de datos entrada
- Mensajes de error estándar
- Documentación automática de campos

### 6. Importación CSV con Manejo de Errores

**Archivo**: `crm/views.py`

```python
@action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
def import_csv(self, request):
    # Validar archivo
    file = request.FILES.get("file")
    
    # Procesar línea por línea
    errors = []
    created_count = 0
    
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            obj, created = Model.objects.get_or_create(
                company=company,
                **validated_data
            )
            if created:
                created_count += 1
        except ValidationError as e:
            errors.append(f"Fila {row_num}: {str(e)}")
    
    return Response({
        'created': created_count,
        'errors': errors
    })
```

**Ventaja**:
- Importa datos sin bloquear la aplicación
- Reporta errores sin fallar completamente (graceful degradation)
- Previene duplicados

### 7. Auditoría Inmutable

**Archivo**: `audit/models.py`

```python
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    action = models.CharField(max_length=10)  # CREATE, UPDATE, DELETE
    model_name = models.CharField(max_length=50)
    object_id = models.IntegerField()
    changes = models.JSONField()  # Qué cambió exactamente
    timestamp = models.DateTimeField(auto_now_add=True)
```

**Middleware en `audit/middleware.py`**:
- Registra todas las acciones
- No se pueden modificar logs
- Trazabilidad completa

---

## Frontend - Next.js + React

### 1. Componentes Reutilizables

**Ejemplo**: `ProtectedRoute.tsx`

```typescript
export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      // Redirigir a login
    }
    setLoading(false);
  }, []);

  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : null;
}
```

**Ventaja**: Reutilizable en múltiples páginas sin duplicar código.

### 2. Interceptor de JWT

**Archivo**: `lib/api.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refrescar token cuando expira
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refrescar token
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
      localStorage.setItem('access_token', response.data.access);
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

**Ventaja**:
- Automático: No necesita agregar el token a cada request
- Renovación automática: El usuario nunca se cierra sesión abruptamente
- Centralizado: Cambios en una sola ubicación

### 3. Sistema de Notificaciones

**Archivo**: `lib/useNotification.ts`

```typescript
export function useNotification() {
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
