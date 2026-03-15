'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowRight, ArrowLeft, User } from 'lucide-react';
import { AVATAR_EMOJI_MAP, Avatar } from '@/types';

type LoginStep = 'email' | 'select-child' | 'pin' | 'parent-password';

// Mock children for demo
const mockChildren = [
  { id: '1', name: 'Oliver', avatar: 'fox' as Avatar, year_group: 'Year 3' },
  { id: '2', name: 'Amelia', avatar: 'unicorn' as Avatar, year_group: 'Year 5' },
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedChild, setSelectedChild] = useState<typeof mockChildren[0] | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'child' | 'parent'>('child');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'child') {
      setStep('select-child');
    } else {
      setStep('parent-password');
    }
  };

  const handleChildSelect = (child: typeof mockChildren[0]) => {
    setSelectedChild(child);
    setStep('pin');
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        // Verify PIN and redirect
        setTimeout(() => {
          router.push('/learn');
        }, 500);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/parent');
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
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <h1
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome back
              </h1>
              <p className="text-slate-light/70 text-center mb-6">Who&apos;s logging in today?</p>

              {/* Login type toggle */}
              <div className="flex rounded-2xl bg-navy/60 p-1 mb-6">
                <button
                  onClick={() => setLoginType('child')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    loginType === 'child'
                      ? 'bg-amber text-navy'
                      : 'text-slate-light hover:text-white'
                  }`}
                >
                  I&apos;m a Learner
                </button>
                <button
                  onClick={() => setLoginType('parent')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    loginType === 'parent'
                      ? 'bg-amber text-navy'
                      : 'text-slate-light hover:text-white'
                  }`}
                >
                  I&apos;m a Parent
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <Input
                  label="Parent&apos;s Email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" className="w-full gap-2">
                  Continue <ArrowRight size={18} />
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-light/60">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="text-amber hover:text-amber-dark font-semibold transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Child */}
          {step === 'select-child' && (
            <motion.div
              key="select-child"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Who&apos;s learning today?
              </h2>
              <p className="text-slate-light/70 text-center mb-6">Choose your profile</p>

              <div className="space-y-3">
                {mockChildren.map((child) => (
                  <motion.button
                    key={child.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChildSelect(child)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-navy/40 border border-white/10 hover:border-amber/30 hover:bg-navy/60 transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center text-3xl">
                      {AVATAR_EMOJI_MAP[child.avatar]}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">{child.name}</h3>
                      <p className="text-sm text-slate-light/60">{child.year_group}</p>
                    </div>
                    <ArrowRight size={18} className="ml-auto text-slate-light/40" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: PIN Entry */}
          {step === 'pin' && selectedChild && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => { setStep('select-child'); setPin(''); }}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-amber/10 flex items-center justify-center text-5xl mx-auto mb-4">
                  {AVATAR_EMOJI_MAP[selectedChild.avatar]}
                </div>
                <h2
                  className="text-2xl font-bold text-white mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hi, {selectedChild.name}!
                </h2>
                <p className="text-slate-light/70">Enter your secret PIN</p>
              </div>

              {/* PIN dots */}
              <div className="flex items-center justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      i < pin.length
                        ? 'bg-amber scale-110'
                        : 'bg-white/20'
                    }`}
                    animate={i < pin.length ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  />
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePinInput(String(num))}
                    className="w-full aspect-square rounded-2xl bg-navy/40 border border-white/10 text-2xl font-bold text-white hover:bg-navy/60 hover:border-amber/30 transition-all flex items-center justify-center"
                  >
                    {num}
                  </motion.button>
                ))}
                <div />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePinInput('0')}
                  className="w-full aspect-square rounded-2xl bg-navy/40 border border-white/10 text-2xl font-bold text-white hover:bg-navy/60 hover:border-amber/30 transition-all flex items-center justify-center"
                >
                  0
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePinDelete}
                  className="w-full aspect-square rounded-2xl bg-navy/40 border border-white/10 text-lg font-bold text-slate-light/60 hover:bg-navy/60 hover:text-white transition-all flex items-center justify-center"
                >
                  ←
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Parent Password */}
          {step === 'parent-password' && (
            <motion.div
              key="parent-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Parent Login
              </h2>
              <p className="text-slate-light/70 text-center mb-6">Enter your password to continue</p>

              <form onSubmit={handleParentLogin} className="space-y-5">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      Sign In <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
