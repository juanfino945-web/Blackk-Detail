import { getAllProducts } from '../lib/db';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  let products = [];
  try {
    products = await getAllProducts();
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
  return <CatalogClient initialProducts={products} />;
}
