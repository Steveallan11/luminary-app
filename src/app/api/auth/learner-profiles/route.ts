import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { resolveParentUserIdByEmail } from '@/lib/parent-auth-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentEmail = searchParams.get('parent_email')?.trim().toLowerCase();

  if (!parentEmail) {
    return NextResponse.json({ error: 'parent_email is required' }, { status: 400 });
  }

  try {
    const parentAuth = await resolveParentUserIdByEmail(parentEmail);
    if (!parentAuth) {
      return NextResponse.json({ error: 'No parent account found for that email.' }, { status: 404 });
    }

    const { parentUserId, parentEmail: normalizedParentEmail } = parentAuth;
    const supabase = getSupabaseServiceClient();
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, family_name, parent_user_id')
      .eq('parent_user_id', parentUserId)
      .maybeSingle();

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    if (!family) {
      return NextResponse.json({ error: 'No family found for that parent email.' }, { status: 404 });
    }

    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, avatar, year_group')
      .eq('family_id', family.id)
      .order('created_at', { ascending: true });

    if (childrenError) {
      return NextResponse.json({ error: childrenError.message }, { status: 500 });
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ error: 'No learner profiles are set up for that family yet.' }, { status: 404 });
    }

    return NextResponse.json({
      family: {
        id: family.id,
        family_name: family.family_name,
        parent_email: normalizedParentEmail,
      },
      children,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
