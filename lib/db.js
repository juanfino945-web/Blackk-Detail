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

export async function ensureCategoriesSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const existing = await sql`SELECT COUNT(*)::int AS count FROM categories`;
  if (existing[0].count === 0) {
    // Primera vez: sembramos las categorías por defecto...
    const defaults = ['Ceras / Lavado 600ml', 'Aromatizantes', 'Accesorios', 'Vonixx'];
    for (const name of defaults) {
      await sql`INSERT INTO categories (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
    }
    // ...y también cualquier categoría que ya estén usando productos existentes,
    // para no perder categorías "viejas" al migrar.
    await ensureSchema();
    const used = await sql`SELECT DISTINCT category FROM products`;
    for (const row of used) {
      await sql`INSERT INTO categories (name) VALUES (${row.category}) ON CONFLICT (name) DO NOTHING`;
    }
  }
}

export async function getAllCategories() {
  await ensureCategoriesSchema();
  const rows = await sql`SELECT id, name FROM categories ORDER BY name ASC`;
  return rows.map(r => ({ id: r.id, name: r.name }));
}

export async function insertCategory(name) {
  await ensureCategoriesSchema();
  const rows = await sql`
    INSERT INTO categories (name) VALUES (${name})
    ON CONFLICT (name) DO NOTHING
    RETURNING id, name
  `;
  if (rows[0]) return rows[0];
  const existing = await sql`SELECT id, name FROM categories WHERE name = ${name}`;
  return existing[0] || null;
}

export async function deleteCategory(id) {
  await ensureCategoriesSchema();
  const cat = await sql`SELECT name FROM categories WHERE id = ${id}`;
  if (!cat[0]) return { error: 'not_found' };

  const inUse = await sql`SELECT COUNT(*)::int AS count FROM products WHERE category = ${cat[0].name}`;
  if (inUse[0].count > 0) {
    return { error: 'in_use', count: inUse[0].count };
  }

  await sql`DELETE FROM categories WHERE id = ${id}`;
  return { ok: true };
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

export async function updateProduct(id, { name, price, category, imageUrl }) {
  await ensureSchema();
  let rows;
  if (imageUrl) {
    rows = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, category = ${category}, image_url = ${imageUrl}
      WHERE id = ${id}
      RETURNING id, name, price, category, image_url
    `;
  } else {
    rows = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, category = ${category}
      WHERE id = ${id}
      RETURNING id, name, price, category, image_url
    `;
  }
  if (!rows[0]) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, price: Number(r.price), category: r.category, image: r.image_url };
}

export async function deleteProduct(id) {
  await ensureSchema();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export { sql };