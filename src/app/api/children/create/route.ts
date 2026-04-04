import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { resolveParentUserIdByEmail } from '@/lib/parent-auth-user';

type CreateChildPayload = {
  parent_email: string;
  family_name?: string;
  child: {
    name: string;
    age: number;
    year_group: string;
    avatar: string;
    learning_mode?: string;
    pin?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateChildPayload>;
    const parentEmail = body.parent_email?.trim().toLowerCase();

    if (!parentEmail) {
      return NextResponse.json({ error: 'parent_email is required' }, { status: 400 });
    }

    if (!body.child?.name || !body.child?.age || !body.child?.year_group || !body.child?.avatar) {
      return NextResponse.json({ error: 'child.name, child.age, child.year_group, child.avatar are required' }, { status: 400 });
    }

    if (!body.child?.pin || !/^\d{4}$/.test(body.child.pin)) {
      return NextResponse.json({ error: 'child.pin must be a 4-digit PIN' }, { status: 400 });
    }

    const parentAuth = await resolveParentUserIdByEmail(parentEmail, { createIfMissing: true });
    if (!parentAuth) {
      return NextResponse.json({ error: 'No parent account found for that email.' }, { status: 404 });
    }

    const { parentUserId } = parentAuth;
    const supabase = getSupabaseServiceClient();
    const pinHash = await hash(body.child.pin, 10);

    // 1) Find or create family
    const { data: existingFamily, error: familyLookupError } = await supabase
      .from('families')
      .select('id')
      .eq('parent_user_id', parentUserId)
      .maybeSingle();

    if (familyLookupError) {
      return NextResponse.json({ error: familyLookupError.message }, { status: 500 });
    }

    let familyId = existingFamily?.id as string | undefined;

    if (!familyId) {
      const { data: createdFamily, error: familyCreateError } = await supabase
        .from('families')
        .insert({
          parent_user_id: parentUserId,
          family_name: body.family_name ?? parentEmail.split('@')[0],
        })
        .select('id')
        .single();

      if (familyCreateError?.message?.includes('family_name')) {
        const { data: fallbackFamily, error: fallbackError } = await supabase
          .from('families')
          .insert({
            parent_user_id: parentUserId,
          })
          .select('id')
          .single();

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }

        familyId = fallbackFamily.id as string;
      } else if (familyCreateError) {
        return NextResponse.json({ error: familyCreateError.message }, { status: 500 });
      }

      if (!familyId) {
        familyId = createdFamily?.id as string | undefined;
      }

      if (!familyId) {
        return NextResponse.json({ error: 'Failed to create family record' }, { status: 500 });
      }
    }

    // 2) Create child
    const childInsertPayload: Record<string, unknown> = {
      family_id: familyId,
      name: body.child.name,
      age: body.child.age,
      year_group: body.child.year_group,
      avatar: body.child.avatar,
      learning_mode: body.child.learning_mode ?? 'full_homeschool',
      pin_hash: pinHash,
    };

    const { data: createdChild, error: childCreateError } = await supabase
      .from('children')
      .insert(childInsertPayload)
      .select('id')
      .single();

    if (childCreateError?.message?.includes('learning_mode')) {
      const fallbackPayload = { ...childInsertPayload };
      delete fallbackPayload.learning_mode;

      const { data: fallbackChild, error: fallbackError } = await supabase
        .from('children')
        .insert(fallbackPayload)
        .select('id')
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      return NextResponse.json({ child_id: fallbackChild.id, family_id: familyId });
    }

    if (childCreateError) {
      return NextResponse.json({ error: childCreateError.message }, { status: 500 });
    }

    return NextResponse.json({ child_id: createdChild.id, family_id: familyId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
