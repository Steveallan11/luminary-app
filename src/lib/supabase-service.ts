import { createClient } from '@supabase/supabase-js';
import { getServiceSupabaseEnv } from '@/lib/supabase-env';

export function getSupabaseServiceClient() {
  const { url, serviceRoleKey } = getServiceSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
