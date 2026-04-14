export function getServerSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'Missing Supabase URL: set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL for server helpers.'
    );
  }
  return url;
}
