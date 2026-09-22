import { NextResponse } from 'next/server';
import { getAllCategories, insertCategory } from '../../../../lib/db';
import { isRequestAuthorized } from '../../../../lib/auth';

export async function GET(request) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const categories = await getAllCategories();
  return NextResponse.json({ categories }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!isRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  if (!name) {
    return NextResponse.json({ error: 'El nombre de la categoría no puede estar vacío.' }, { status: 400 });
  }
  const category = await insertCategory(name);
  return NextResponse.json({ category }, { headers: { 'Cache-Control': 'no-store' } });
}