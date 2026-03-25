import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET: Fetch children for a parent's email
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // First, find the family by parent email
    // We need to look up auth.users by email through the parent_profiles or families table
    // Since we can't query auth.users directly, we use a different approach:
    // Query families where the parent's email matches

    const { data: families, error: familyError } = await supabase
      .from('families')
      .select(`
        id,
        family_name,
        parent_user_id
      `)
      .limit(100);

    if (familyError) {
      console.error('Family lookup error:', familyError);
      return NextResponse.json(
        { error: 'Failed to find family' },
        { status: 500 }
      );
    }

    // We need to verify which family belongs to this email
    // For now, we'll use a workaround: check if the user exists and get their family
    
    // Alternative approach: Look up by stored email in parent_profiles
    const { data: parentProfile, error: profileError } = await supabase
      .from('parent_profiles')
      .select('user_id, family_id')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !parentProfile) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Get children for this family
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, avatar, year_group')
      .eq('family_id', parentProfile.family_id)
      .order('name');

    if (childrenError) {
      console.error('Children lookup error:', childrenError);
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      familyId: parentProfile.family_id,
      children: children || [],
    });
  } catch (error) {
    console.error('Child lookup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST: Verify child PIN
export async function POST(request: NextRequest) {
  try {
    const { childId, pin } = await request.json();

    if (!childId || !pin) {
      return NextResponse.json(
        { error: 'Child ID and PIN are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the child with their PIN hash
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, avatar, year_group, family_id, pin_hash')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, child.pin_hash);

    if (!pinValid) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      );
    }

    // Return child session data (without PIN hash)
    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        yearGroup: child.year_group,
        familyId: child.family_id,
      },
    });
  } catch (error) {
    console.error('Child login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
