import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { updateProduct, deleteProduct } from '../../../../../lib/db';
import { isRequestAuthorized } from '../../../../../lib/auth';

function parsePrice(raw) {
  if (typeof raw === 'number') return raw;
  if (!raw) return NaN;
  let str = String(raw).trim().replace(/[$ \s]/g, '');
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace(',', '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace('.', '');
    }
  }
  return parseFloat(str);
}

export async function PUT(request, { params }) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const id = Number(resolvedParams?.id);
  if (!id) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const formData = await request.formData();
  const name = (formData.get('name') || '').toString().trim();
  const priceRaw = (formData.get('price') || '').toString();
  const category = (formData.get('category') || '').toString().trim();
  const file = formData.get('image');
  const imageUrlRaw = (formData.get('imageUrl') || '').toString().trim();

  const price = parsePrice(priceRaw);

  if (!name || !category || isNaN(price) || price < 0) {
    return NextResponse.json({ error: 'Faltan datos o precio inválido: nombre, precio y categoría son obligatorios.' }, { status: 400 });
  }

  try {
    let imageUrl = imageUrlRaw || null;

    // La imagen es opcional al editar: si se eligió un archivo nuevo, se sube.
    if (file && typeof file === 'object' && file.size > 0) {
      const ext = (file.name && file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext) ? ext : 'jpg';
      const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

      const blob = await put(key, file, {
        access: 'public',
        contentType: file.type || 'image/jpeg'
      });
      imageUrl = blob.url;
    }

    const product = await updateProduct(id, { name, price, category, imageUrl });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath('/api/products');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    return NextResponse.json(
      { product },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Error updateProduct:', err);
    return NextResponse.json({ error: 'No se pudo actualizar el producto: ' + (err.message || 'Error del servidor') }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const resolvedParams = await Promise.resolve(params);
  const id = Number(resolvedParams?.id);
  if (!id) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  try {
    await deleteProduct(id);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath('/api/products');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Error deleteProduct:', err);
    return NextResponse.json({ error: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}