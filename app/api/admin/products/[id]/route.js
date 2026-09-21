import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { updateProduct, deleteProduct } from '../../../../../lib/db';
import { isRequestAuthorized } from '../../../../../lib/auth';

export async function PUT(request, { params }) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const formData = await request.formData();
  const name = (formData.get('name') || '').toString().trim();
  const priceRaw = (formData.get('price') || '').toString();
  const category = (formData.get('category') || '').toString().trim();
  const file = formData.get('image');

  const price = parseFloat(priceRaw);

  if (!name || !category || !price) {
    return NextResponse.json({ error: 'Faltan datos: nombre, precio o categoría.' }, { status: 400 });
  }

  try {
    let imageUrl = null;

    // La imagen es opcional al editar: solo se sube y se reemplaza si se eligió un archivo nuevo.
    if (file instanceof File && file.size > 0) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
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

    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudo actualizar el producto.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}