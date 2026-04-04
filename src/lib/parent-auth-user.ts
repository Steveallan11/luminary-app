import { randomBytes } from 'crypto';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

const AUTH_LIST_PAGE_SIZE = 200;
const AUTH_LIST_MAX_PAGES = 20;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateStrongPassword(): string {
  return `${randomBytes(24).toString('base64url')}aA1!`;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  const supabase = getSupabaseServiceClient();

  for (let page = 1; page <= AUTH_LIST_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_LIST_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users ?? [];
    const matchedUser = users.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (matchedUser?.id) {
      return matchedUser.id;
    }

    if (users.length < AUTH_LIST_PAGE_SIZE) {
      break;
    }
  }

  return null;
}

export async function resolveParentUserIdByEmail(
  email: string,
  options?: { createIfMissing?: boolean }
): Promise<{ parentUserId: string; parentEmail: string } | null> {
  const normalizedEmail = normalizeEmail(email);
  const createIfMissing = Boolean(options?.createIfMissing);
  const existingUserId = await findAuthUserIdByEmail(normalizedEmail);

  if (existingUserId) {
    return { parentUserId: existingUserId, parentEmail: normalizedEmail };
  }

  if (!createIfMissing) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: generateStrongPassword(),
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.user?.id) {
    throw new Error('Failed to create parent auth account.');
  }

  return { parentUserId: data.user.id, parentEmail: normalizedEmail };
}
