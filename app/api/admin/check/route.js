import { NextResponse } from 'next/server';
import { isRequestAuthorized } from '../../../../lib/auth';

export async function GET(request) {
  return NextResponse.json({ authorized: isRequestAuthorized(request) });
}
