import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, familyName } = await request.json();

    if (!email || !password || !familyName) {
      return NextResponse.json(
        { error: 'Email, password, and family name are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${request.headers.get('origin')}/auth/onboarding`,
        data: {
          family_name: familyName,
        },
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // The family and parent_profile will be created by a database trigger
    // OR we create them here using service role (if available)
    // For now, we'll create them after email verification in onboarding

    return NextResponse.json({
      success: true,
      message: 'Please check your email to verify your account',
      userId: authData.user.id,
      emailConfirmationRequired: !authData.session, // If no session, email confirmation is required
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
