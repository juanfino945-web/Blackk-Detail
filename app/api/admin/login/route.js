import { NextResponse } from 'next/server';
import { isValidPassword, expectedToken, ADMIN_COOKIE } from '../../../../lib/auth';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: 'Clave incorrecta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 días
  });
  return res;
}
