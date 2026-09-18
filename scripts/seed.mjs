// Corré esto UNA sola vez, después de conectar Neon y Blob al proyecto:
//   1. vercel env pull .env.local
//   2. npm install
//   3. npm run seed
//
// Esto crea la tabla "products" (si no existe) y carga los 29 productos
// iniciales, subiendo cada imagen a Vercel Blob.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL. Corré "vercel env pull .env.local" primero.');
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Falta BLOB_READ_WRITE_TOKEN. Conectá un Blob store al proyecto en Vercel y volvé a hacer "vercel env pull .env.local".');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const existing = await sql`SELECT COUNT(*)::int AS count FROM products`;
  if (existing[0].count > 0) {
    console.log(`La tabla ya tiene ${existing[0].count} productos. Si querés volver a sembrar desde cero, vaciá la tabla "products" primero.`);
    process.exit(0);
  }

  const productsPath = path.join(__dirname, '..', 'seed-data', 'products.json');
  const items = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  console.log(`Subiendo ${items.length} productos...`);

  for (const item of items) {
    const imgPath = path.join(__dirname, '..', 'seed-data', 'images', item.file);
    const buffer = fs.readFileSync(imgPath);

    const blob = await put(`products/${item.file}`, buffer, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    await sql`
      INSERT INTO products (name, price, category, image_url)
      VALUES (${item.name}, ${item.price}, ${item.category}, ${blob.url})
    `;

    console.log(`OK: ${item.name}`);
  }

  console.log('Listo. Catálogo inicial cargado.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
