# Blackk Detail — Web con panel administrador

Catálogo de productos con base de datos (Neon Postgres) y panel de administrador
protegido por clave, para agregar o eliminar productos sin tocar código.

## 1. Subir el proyecto a GitHub

1. Creá un repositorio nuevo en GitHub (puede ser privado).
2. Subí esta carpeta completa a ese repositorio:
   ```
   git init
   git add .
   git commit -m "Proyecto inicial Blackk Detail"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

## 2. Importar el proyecto en Vercel

1. En Vercel, **Add New → Project** y elegí el repositorio que acabás de subir.
2. Antes de dar "Deploy", andá a la sección de la base de datos Neon que ya creaste
   (Storage → tu base de datos) y conectala a este proyecto (botón "Connect Project").
   Esto agrega automáticamente la variable `DATABASE_URL`.
3. Creá también un **Blob store** (Storage → Blob → Create) y conectalo al mismo
   proyecto. Esto agrega automáticamente `BLOB_READ_WRITE_TOKEN`.
4. En **Project Settings → Environment Variables**, agregá estas dos manualmente:
   - `ADMIN_PASSWORD` → la clave que vas a usar para entrar a `/admin`.
   - `ADMIN_SECRET` → cualquier frase larga y random (sirve para firmar la sesión).
5. Dale **Deploy**.

## 3. Cargar los 29 productos iniciales (una sola vez)

Esto se hace desde tu computadora, no desde Vercel:

```bash
npm install -g vercel     # si no lo tenés instalado
vercel link               # conectá esta carpeta con el proyecto de Vercel
vercel env pull .env.local
npm install
npm run seed
```

Esto sube las 29 imágenes al Blob store y crea los 29 productos en la base de datos.
Si en algún momento querés volver a partir de cero, vaciá la tabla `products` en Neon
(desde el panel de Neon, "Tables" → `products` → borrar filas) y volvé a correr `npm run seed`.

## 4. Usar el panel administrador

Entrá a `https://tu-dominio.vercel.app/admin`, ingresá la clave (`ADMIN_PASSWORD`) y
desde ahí podés:
- Agregar un producto nuevo (nombre, precio, categoría, imagen).
- Eliminar cualquier producto existente.

Los cambios se ven al instante en la página pública — no hace falta redeploy ni descargar
ningún archivo. El link `/admin` no aparece en ningún lado del sitio público; solo quien
tenga la URL y la clave puede entrar.

## 5. Desarrollo local (opcional)

```bash
npm install
vercel env pull .env.local   # trae DATABASE_URL y BLOB_READ_WRITE_TOKEN
npm run dev
```

Abrí `http://localhost:3000`.

## Estructura del proyecto

- `app/page.js` + `app/CatalogClient.js` — catálogo público.
- `app/admin/` — panel administrador (protegido por clave).
- `app/api/products` — API pública de solo lectura.
- `app/api/admin/*` — API protegida (login, alta y baja de productos).
- `lib/db.js` — conexión a la base de datos (Neon).
- `lib/auth.js` — verificación de la sesión de administrador.
- `scripts/seed.mjs` — carga inicial de los 29 productos.
