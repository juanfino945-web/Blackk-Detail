import { NextResponse } from 'next/server';
import { deleteProduct } from '../../../../../lib/db';
import { isRequestAuthorized } from '../../../../../lib/auth';

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
