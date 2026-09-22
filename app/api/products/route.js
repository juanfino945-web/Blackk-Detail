import { NextResponse } from 'next/server';
import { getAllProducts } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo.' }, { status: 500 });
  }
}
