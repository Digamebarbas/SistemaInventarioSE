# Frontend - Sistema de Inventario y Trazabilidad

Frontend desarrollado con Next.js y TypeScript para operar el sistema de inventario multiempresa.

## Stack

- Next.js 16
- React
- TypeScript
- Axios
- Tailwind CSS

## Ejecucion

```bash
cd frontend
npm install
npm run dev
```

## Variable requerida

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

En produccion debe apuntar al backend desplegado en Render.

## Funcionalidades del frontend

- login y refresco automatico de token
- rutas protegidas
- dashboard con metricas
- gestion de productos
- gestion de movimientos
- clientes y proveedores
- alertas
- reportes con exportacion CSV

## Paginas principales

- `/login`
- `/dashboard`
- `/productos`
- `/movimientos`
- `/clientes`
- `/proveedores`
- `/alertas`
- `/reportes`
- `/usuarios`

## Notas de integracion

- el cliente HTTP centralizado esta en `src/lib/api.ts`
- la autenticacion depende de `access_token` y `refresh_token` en almacenamiento local
- la aplicacion espera un backend compatible con los endpoints documentados en el README principal
