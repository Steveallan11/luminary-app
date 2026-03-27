import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

type CreateChildPayload = {
  parent_email: string;
  family_name?: string;
  child: {
    name: string;
    age: number;
    year_group: string;
    avatar: string;
    pin_hash?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateChildPayload>;

    if (!body.parent_email) {
      return NextResponse.json({ error: 'parent_email is required' }, { status: 400 });
    }

    if (!body.child?.name || !body.child?.age || !body.child?.year_group || !body.child?.avatar) {
      return NextResponse.json({ error: 'child.name, child.age, child.year_group, child.avatar are required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // 1) Find or create family
    const { data: existingFamily, error: familyLookupError } = await supabase
      .from('families')
      .select('id')
      .eq('parent_email', body.parent_email)
      .maybeSingle();

    if (familyLookupError) {
      return NextResponse.json({ error: familyLookupError.message }, { status: 500 });
    }

    let familyId = existingFamily?.id as string | undefined;

    if (!familyId) {
      const { data: createdFamily, error: familyCreateError } = await supabase
        .from('families')
        .insert({
          parent_email: body.parent_email,
          family_name: body.family_name ?? body.parent_email.split('@')[0],
        })
        .select('id')
        .single();

      if (familyCreateError) {
        return NextResponse.json({ error: familyCreateError.message }, { status: 500 });
      }

      familyId = createdFamily.id as string;
    }

    // 2) Create child
    const { data: createdChild, error: childCreateError } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name: body.child.name,
        age: body.child.age,
        year_group: body.child.year_group,
        avatar: body.child.avatar,
        // Note: pin_hash will be added once we wire real pin hashing/verification.
      })
      .select('id')
      .single();

    if (childCreateError) {
      return NextResponse.json({ error: childCreateError.message }, { status: 500 });
    }

    return NextResponse.json({ child_id: createdChild.id, family_id: familyId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
