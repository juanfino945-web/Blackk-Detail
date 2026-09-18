import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { insertProduct } from '../../../../lib/db';
import { isRequestAuthorized } from '../../../../lib/auth';

export async function POST(request) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const formData = await request.formData();
  const name = (formData.get('name') || '').toString().trim();
  const priceRaw = (formData.get('price') || '').toString();
  const category = (formData.get('category') || '').toString().trim();
  const file = formData.get('image');

  const price = parseFloat(priceRaw);

  if (!name || !category || !price || !(file instanceof File)) {
    return NextResponse.json({ error: 'Faltan datos: nombre, precio, categoría o imagen.' }, { status: 400 });
  }

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const blob = await put(key, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg'
    });

    const product = await insertProduct({
      name,
      price,
      category,
      imageUrl: blob.url
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudo guardar el producto.' }, { status: 500 });
  }
}
