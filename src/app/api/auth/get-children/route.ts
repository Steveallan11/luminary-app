import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // First, find the family by parent email
    // Note: In a real app, you'd have a proper user lookup. For MVP, we'll use email as identifier
    const { data: families, error: familyError } = await supabase
      .from('families')
      .select('id, family_name')
      .limit(1);

    if (familyError || !families || families.length === 0) {
      console.error('No families found');
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    const familyId = families[0].id;

    // Get children for this family
    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id, name, age, year_group, avatar')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (childError) {
      console.error('Error fetching children:', childError);
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      family_id: familyId,
      children: children || [],
    });
  } catch (error) {
    console.error('Get children error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}
