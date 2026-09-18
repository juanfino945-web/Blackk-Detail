import crypto from 'crypto';

export const ADMIN_COOKIE = 'blackk_admin_session';

// Token fijo derivado del secreto del servidor: nunca viaja la contraseña,
// y no puede reconstruirse sin conocer ADMIN_SECRET (que solo vive en el servidor).
export function expectedToken() {
  const secret = process.env.ADMIN_SECRET || 'dev-secret-change-me';
  return crypto.createHmac('sha256', secret).update('blackk-detail-admin').digest('hex');
}

export function isValidPassword(password) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real) return false;
  return password === real;
}

export function isRequestAuthorized(request) {
  const cookie = request.cookies.get(ADMIN_COOKIE);
  if (!cookie) return false;
  return cookie.value === expectedToken();
}
