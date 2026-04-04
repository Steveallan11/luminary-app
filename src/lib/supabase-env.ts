function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.local.example to .env.local and set the Supabase contract before starting Luminary.`
    );
  }

  return value;
}

export function getPublicSupabaseEnv() {
  return {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getServiceSupabaseEnv() {
  return {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

export function getSupabaseEnvContractReport() {
  const serviceUrl = readEnv('SUPABASE_URL');
  const publicUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  const missing = [
    !serviceUrl ? 'SUPABASE_URL' : null,
    !publicUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
    !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
  ].filter(Boolean) as string[];

  return {
    missing,
    resolvedServiceUrlSource: serviceUrl ? 'SUPABASE_URL' : null,
    isValid: missing.length === 0,
  };
}
