import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Avatar, LearningMode } from '@/types';

interface ChildData {
  name: string;
  age: number;
  yearGroup: string;
  learningMode: LearningMode;
  avatar: Avatar;
  pin: string;
}

export async function POST(request: NextRequest) {
  try {
    const { child } = await request.json() as { child: ChildData };

    if (!child || !child.name || !child.pin) {
      return NextResponse.json(
        { error: 'Child data with name and PIN is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to complete onboarding' },
        { status: 401 }
      );
    }

    // Check if the user already has a family
    let familyId: string;
    
    const { data: existingFamily, error: familyCheckError } = await supabase
      .from('families')
      .select('id')
      .eq('parent_user_id', user.id)
      .single();

    if (existingFamily) {
      familyId = existingFamily.id;
    } else {
      // Create the family
      const familyName = user.user_metadata?.family_name || 'My Family';
      
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          parent_user_id: user.id,
          family_name: familyName,
          subscription_tier: 'free',
          subscription_status: 'none',
        })
        .select('id')
        .single();

      if (familyError || !newFamily) {
        console.error('Family creation error:', familyError);
        return NextResponse.json(
          { error: 'Failed to create family' },
          { status: 500 }
        );
      }

      familyId = newFamily.id;

      // Create or update parent profile
      const { error: profileError } = await supabase
        .from('parent_profiles')
        .upsert({
          user_id: user.id,
          family_id: familyId,
          email: user.email?.toLowerCase(),
          display_name: familyName.replace(' Family', '').replace(' family', ''),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail - profile is not critical
      }
    }

    // Hash the child's PIN
    const pinHash = await bcrypt.hash(child.pin, 10);

    // Create the child
    const { data: newChild, error: childError } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name: child.name,
        age: child.age,
        year_group: child.yearGroup,
        avatar: child.avatar,
        learning_mode: child.learningMode,
        pin_hash: pinHash,
        xp_total: 0,
        streak_days: 0,
      })
      .select('id, name, avatar, year_group')
      .single();

    if (childError || !newChild) {
      console.error('Child creation error:', childError);
      return NextResponse.json(
        { error: 'Failed to create child profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      familyId,
      child: {
        id: newChild.id,
        name: newChild.name,
        avatar: newChild.avatar,
        yearGroup: newChild.year_group,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET: Check onboarding status
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has a family with children
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select(`
        id,
        family_name,
        children (
          id,
          name
        )
      `)
      .eq('parent_user_id', user.id)
      .single();

    if (familyError || !family) {
      return NextResponse.json({
        hasFamily: false,
        hasChildren: false,
        needsOnboarding: true,
      });
    }

    const hasChildren = family.children && family.children.length > 0;

    return NextResponse.json({
      hasFamily: true,
      hasChildren,
      needsOnboarding: !hasChildren,
      familyName: family.family_name,
      childCount: family.children?.length || 0,
    });
  } catch (error) {
    console.error('Onboarding check error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
