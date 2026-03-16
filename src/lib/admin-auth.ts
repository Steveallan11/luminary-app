import { cookies } from 'next/headers';

export const ADMIN_EMAILS = ['steveallan2018@gmail.com'];
export const ADMIN_SESSION_COOKIE = 'luminary_admin_email';

export function isAllowedAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function getAdminSessionEmail() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value?.toLowerCase() ?? null;
}

export async function isAdminAuthenticated() {
  const email = await getAdminSessionEmail();
  return email ? isAllowedAdminEmail(email) : false;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, email.trim().toLowerCase(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
