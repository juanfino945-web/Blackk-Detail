import { NextResponse } from 'next/server';
import { deleteCategory } from '../../../../../lib/db';
import { isRequestAuthorized } from '../../../../../lib/auth';

export async function DELETE(request, { params }) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const resolvedParams = await Promise.resolve(params);
  const id = Number(resolvedParams?.id);
  if (!id) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const result = await deleteCategory(id);
  if (result.error === 'not_found') {
    return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
  }
  if (result.error === 'in_use') {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${result.count} producto(s) usando esta categoría. Cambiá la categoría de esos productos primero (o eliminalos).` },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}