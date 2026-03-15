'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Sparkles, ArrowLeft, Crown, Zap, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import { MOCK_FAMILY } from '@/lib/mock-data';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Get started with the basics',
    icon: Star,
    colour: '#6366F1',
    popular: false,
    features: [
      '3 subjects',
      '1 child profile',
      '3 sessions per week',
      'Lumi AI tutor',
      'Basic progress tracking',
    ],
    notIncluded: [
      'PDF progress reports',
      'All 15 subjects',
      'Multiple children',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: '9.99',
    period: '/month',
    description: 'Everything your family needs',
    icon: Sparkles,
    colour: '#F59E0B',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID,
    features: [
      'All 15 subjects',
      'Up to 3 children',
      'Unlimited sessions',
      'Lumi AI tutor',
      'Full progress tracking',
      'PDF progress reports',
      'Achievement badges',
      'Weekly heatmap',
    ],
    notIncluded: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '14.99',
    period: '/month',
    description: 'For serious learners',
    icon: Crown,
    colour: '#8B5CF6',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Family',
      'Up to 5 children',
      'GCSE mode (coming soon)',
      'Priority support',
      'Advanced analytics',
      'Custom learning paths',
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = MOCK_FAMILY.subscription_tier;

  const handleSubscribe = async (planId: string, priceId?: string) => {
    if (!priceId || planId === 'free') return;

    setLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          familyId: MOCK_FAMILY.id,
          email: 'parent@example.com',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-light/60 max-w-xl mx-auto">
            Unlock the full power of Luminary for your family&apos;s learning journey
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id;

            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-3xl border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-amber/40 bg-navy-light/80'
                    : 'border-white/10 bg-navy-light/40'
                }`}
                style={
                  plan.popular
                    ? { boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }
                    : undefined
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber text-navy text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${plan.colour}20` }}
                  >
                    <Icon size={22} style={{ color: plan.colour }} />
                  </div>
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  <p className="text-sm text-slate-light/50">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === '0' ? 'Free' : `£${plan.price}`}
                  </span>
                  {plan.price !== '0' && (
                    <span className="text-slate-light/50 text-sm">{plan.period}</span>
                  )}
                </div>

                <div className="flex-1 mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-light/80">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded?.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm opacity-40">
                        <span className="w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0 text-slate-light/30">
                          &mdash;
                        </span>
                        <span className="text-slate-light/40 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isCurrent ? (
                  <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-slate-light/60 font-semibold">
                    Current Plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-slate-light/40">
                    Included
                  </div>
                ) : (
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id, plan.priceId)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* FAQ / Trust signals */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-slate-light/40 mb-2">
            Cancel anytime. No hidden fees. Secure payment via Stripe.
          </p>
          <p className="text-xs text-slate-light/30">
            Test mode: Use card number 4242 4242 4242 4242, any future expiry, any CVC
          </p>
        </motion.div>
      </div>
    </div>
  );
}
