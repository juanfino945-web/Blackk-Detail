import { neon } from '@neondatabase/serverless';

// Reutiliza la conexión entre invocaciones (importante en serverless).
const sql = neon(process.env.DATABASE_URL);

export async function ensureSchema() {
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
  await ensureSchema();
  const rows = await sql`SELECT id, name, price, category, image_url FROM products ORDER BY id ASC`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    category: r.category,
    image: r.image_url
  }));
}

export async function insertProduct({ name, price, category, imageUrl }) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO products (name, price, category, image_url)
    VALUES (${name}, ${price}, ${category}, ${imageUrl})
    RETURNING id, name, price, category, image_url
  `;
  const r = rows[0];
  return { id: r.id, name: r.name, price: Number(r.price), category: r.category, image: r.image_url };
}

export async function deleteProduct(id) {
  await ensureSchema();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export { sql };
