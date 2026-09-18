import { NextResponse } from 'next/server';
import { getAllProducts } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo.' }, { status: 500 });
  }
}
