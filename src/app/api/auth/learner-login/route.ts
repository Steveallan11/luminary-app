import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { resolveParentUserIdByEmail } from '@/lib/parent-auth-user';

type LearnerLoginPayload = {
  parent_email?: string;
  child_id?: string;
  pin?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LearnerLoginPayload;
    const parentEmail = body.parent_email?.trim().toLowerCase();

    if (!parentEmail || !body.child_id || !body.pin) {
      return NextResponse.json(
        { error: 'parent_email, child_id, and pin are required' },
        { status: 400 }
      );
    }

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

    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, family_id, name, avatar, year_group, pin_hash')
      .eq('id', body.child_id)
      .eq('family_id', family.id)
      .maybeSingle();

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
    }

    if (!child) {
      return NextResponse.json({ error: 'Learner profile not found for that family.' }, { status: 404 });
    }

    const isValidPin = Boolean(child.pin_hash) && await compare(body.pin, child.pin_hash);
    if (!isValidPin) {
      return NextResponse.json({ error: 'Incorrect PIN. Try again.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      family: {
        id: family.id,
        family_name: family.family_name,
        parent_email: normalizedParentEmail,
      },
      child: {
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        year_group: child.year_group,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
