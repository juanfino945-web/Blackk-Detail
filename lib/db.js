import { neon } from '@neondatabase/serverless';

// Crea la conexión únicamente cuando una operación de base de datos la necesita.
// Esto evita que el build de Next.js intente inicializar Neon antes de tiempo.
function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  return neon(connectionString);
}

export async function ensureSchema() {
  const sql = getDb();

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
}

export async function getAllProducts() {
  const sql = getDb();

  await ensureSchema();

  const rows = await sql`
    SELECT id, name, price, category, image_url
    FROM products
    ORDER BY id ASC
  `;

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    category: r.category,
    image: r.image_url
  }));
}

export async function insertProduct({ name, price, category, imageUrl }) {
  const sql = getDb();

  await ensureSchema();

  const rows = await sql`
    INSERT INTO products (name, price, category, image_url)
    VALUES (${name}, ${price}, ${category}, ${imageUrl})
    RETURNING id, name, price, category, image_url
  `;

  const r = rows[0];

  return {
    id: r.id,
    name: r.name,
    price: Number(r.price),
    category: r.category,
    image: r.image_url
  };
}

export async function deleteProduct(id) {
  const sql = getDb();

  await ensureSchema();
  await sql`DELETE FROM products WHERE id = ${id}`;
}
