# Despliegue en Vercel - Guía de Configuración

## Problema Identificado
Cuando el proyecto está desplegado en Vercel, aparecen errores **400** en las peticiones a `/api/auth/login` y `/api/auth/register` porque:

1. El frontend en Vercel no conoce dónde está el backend
2. El backend no tiene CORS configurado para aceptar solicitudes desde Vercel

## Solución

### 1. Backend - Variables de Entorno
Configura estas variables en tu plataforma de despliegue del backend:

```
DJANGO_SECRET_KEY=tu-clave-secreta-aqui
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=tu-dominio-backend.com
CORS_ALLOWED_ORIGINS=https://tu-frontend-vercel.vercel.app
CSRF_TRUSTED_ORIGINS=https://tu-frontend-vercel.vercel.app
```

### 2. Frontend en Vercel - Variables de Entorno
En la consola de Vercel, configura:

```
NEXT_PUBLIC_API_URL=https://tu-backend-api.com/api
```

**Reemplaza `tu-backend-api.com` con la URL real de tu backend desplegado.**

### 3. Verificación
Después de configurar las variables:

1. Redeploy del backend con las nuevas variables
2. Redeploy del frontend en Vercel
3. Prueba login/registro en https://tu-frontend-vercel.vercel.app

## Ejemplo de URLs Reales

Si tu frontend está en: `https://mi-inventario.vercel.app`
Y tu backend en: `https://api-inventario.railway.app`

**Backend env:**
```
CORS_ALLOWED_ORIGINS=https://mi-inventario.vercel.app
CSRF_TRUSTED_ORIGINS=https://mi-inventario.vercel.app
```

**Frontend env (Vercel):**
```
NEXT_PUBLIC_API_URL=https://api-inventario.railway.app/api
```

## Error Común: 400 Bad Request
Si ves este error:
- POST `/api/auth/login` 400
- POST `/api/auth/register` 400

**Causas:**
1. ✗ `NEXT_PUBLIC_API_URL` no configurada o incorrecta
2. ✗ CORS no habilitado en backend
3. ✗ Backend no levantado o no accesible desde Vercel

**Solución:**
1. Verifica la URL del backend en browser: `https://tu-backend/api/auth/login/`
2. Confirma que responde (aunque sea error 405)
3. Configura las variables de entorno correctamente
4. Redeploy ambas aplicaciones
