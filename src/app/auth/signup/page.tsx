'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowRight, Sparkles, Mail } from 'lucide-react';

type SignupStep = 'form' | 'verify-email';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, familyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      if (data.emailConfirmationRequired) {
        // Show email verification step
        setStep('verify-email');
      } else {
        // Email confirmation not required, go to onboarding
        router.push('/auth/onboarding');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy relative flex items-center justify-center px-4">
      <Starfield />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">✨</span>
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Luminary
            </span>
          </Link>
          
          {step === 'form' && (
            <>
              <h1
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Create your family account
              </h1>
              <p className="text-slate-light/70">Start your child&apos;s learning adventure today</p>
            </>
          )}
        </div>

        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
          >
            <form onSubmit={handleSignup} className="space-y-5">
              <Input
                label="Family Name"
                placeholder="e.g. The Smith Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-light/60">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-amber hover:text-amber-dark font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'verify-email' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-6">
              <Mail size={40} className="text-amber" />
            </div>
            
            <h2
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Check your email
            </h2>
            
            <p className="text-slate-light/70 mb-2">
              We&apos;ve sent a verification link to:
            </p>
            <p className="text-white font-semibold mb-6">{email}</p>
            
            <p className="text-sm text-slate-light/60 mb-8">
              Click the link in the email to verify your account and continue setting up your family&apos;s learning journey.
            </p>
            
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => setStep('form')}
              >
                Use a different email
              </Button>
            </div>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-light/40">
            <Sparkles size={12} />
            <span>Free to start. No credit card required.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
