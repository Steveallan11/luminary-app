import { createClient } from '@supabase/supabase-js';
import { getServerSupabaseUrl } from '@/lib/server-env';

export function getSupabaseServiceClient() {
  const url = getServerSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY while building a Supabase service client.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
