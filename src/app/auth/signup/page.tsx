'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
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
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('luminary_parent_email', email.trim().toLowerCase());
        sessionStorage.setItem('luminary_family_name', familyName.trim());
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      const params = new URLSearchParams({
        parent_email: email.trim().toLowerCase(),
        family_name: familyName.trim(),
      });
      router.push(`/auth/onboarding?${params.toString()}`);
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
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Create your family account
          </h1>
          <p className="text-slate-light/70">Start your child&apos;s learning adventure today</p>
        </div>

        {/* Form */}
        <div className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8">
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
        </div>

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
