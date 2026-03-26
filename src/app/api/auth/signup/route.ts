import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, familyName } = await request.json();
    console.log('[v0] Signup attempt:', { email, familyName });

    if (!email || !password || !familyName) {
      return NextResponse.json(
        { error: 'Email, password, and family name are required' },
        { status: 400 }
      );
    }

    // Check env vars are present
    console.log('[v0] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[v0] Supabase Anon Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabase = await createServerSupabaseClient();
    console.log('[v0] Supabase client created successfully');

    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${request.headers.get('origin')}/auth/onboarding`;
    console.log('[v0] Redirect URL:', redirectUrl);

    // Sign up with Supabase Auth
    // The callback route will exchange the code for a session and redirect to onboarding
    const origin = request.headers.get('origin') || 'https://www.meetlumi.co.uk';
    const callbackUrl = `${origin}/auth/callback?next=/auth/onboarding`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || callbackUrl,
        data: {
          family_name: familyName,
        },
      },
    });

    if (authError) {
      console.error('[v0] Supabase auth error:', authError.message, authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    console.log('[v0] Auth signup successful:', { userId: authData.user?.id, hasSession: !!authData.session });

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
