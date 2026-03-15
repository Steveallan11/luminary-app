import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 subjects',
      '1 child profile',
      '3 sessions per week',
      'Lumi AI tutor',
      'Basic progress tracking',
    ],
    limits: {
      maxSubjects: 3,
      maxChildren: 1,
      maxSessionsPerWeek: 3,
      pdfReports: false,
    },
  },
  family: {
    name: 'Family',
    price: 9.99,
    priceId: process.env.STRIPE_FAMILY_PRICE_ID,
    features: [
      'All 15 subjects',
      'Up to 3 children',
      'Unlimited sessions',
      'Lumi AI tutor',
      'Full progress tracking',
      'PDF progress reports',
      'Achievement badges',
    ],
    limits: {
      maxSubjects: 15,
      maxChildren: 3,
      maxSessionsPerWeek: Infinity,
      pdfReports: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 14.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Family',
      'Up to 5 children',
      'GCSE mode (coming soon)',
      'Priority support',
      'Advanced analytics',
    ],
    limits: {
      maxSubjects: 15,
      maxChildren: 5,
      maxSessionsPerWeek: Infinity,
      pdfReports: true,
    },
  },
} as const;
