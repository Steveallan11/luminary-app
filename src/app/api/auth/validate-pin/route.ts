import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export async function POST(req: NextRequest) {
  try {
    const { family_id, child_id, pin } = await req.json();

    if (!family_id || !child_id || !pin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate PIN is 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Get child and verify they belong to this family
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, family_id, name, age, year_group, avatar, pin_hash, xp_total, streak_days')
      .eq('id', child_id)
      .eq('family_id', family_id)
      .single();

    if (childError || !child) {
      console.error('Child not found or does not belong to family:', childError);
      return NextResponse.json(
        { error: 'Child not found or invalid access' },
        { status: 404 }
      );
    }

    // Verify PIN against hash
    const pinValid = await bcrypt.compare(pin, child.pin_hash);

    if (!pinValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // PIN is valid - return child data
    return NextResponse.json({
      success: true,
      child_id: child.id,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        year_group: child.year_group,
        avatar: child.avatar,
        xp_total: child.xp_total,
        streak_days: child.streak_days,
      },
      // Session metadata
      sessionData: {
        child_id: child.id,
        family_id: family_id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('PIN validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate PIN' },
      { status: 500 }
    );
  }
}
