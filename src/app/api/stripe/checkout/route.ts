import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId, familyId, email } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        family_id: familyId || '',
      },
      success_url: `${appUrl}/parent?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
