import './globals.css';

export const metadata = {
  title: 'Blackk Detail — Catálogo',
  description: 'Productos para detailing y cuidado automotor: ceras, aromatizantes, accesorios y línea Vonixx.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
