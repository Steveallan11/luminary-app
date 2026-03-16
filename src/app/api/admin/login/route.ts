import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAdminEmail, setAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!isAllowedAdminEmail(email)) {
      return NextResponse.json({ error: 'This email does not have admin access.' }, { status: 403 });
    }

    await setAdminSession(email);

    return NextResponse.json({ ok: true, email });
  } catch {
    return NextResponse.json({ error: 'Unable to start admin session.' }, { status: 500 });
  }
}
