'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { AVATARS, YEAR_GROUPS, Avatar, LearningMode } from '@/types';
import { setChildSession } from '@/lib/child-session';

type OnboardingStep = 'loading' | 'name' | 'details' | 'avatar' | 'pin' | 'saving' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('loading');
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [learningMode, setLearningMode] = useState<LearningMode>('full_homeschool');
  const [avatar, setAvatar] = useState<Avatar>('fox');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [savedChild, setSavedChild] = useState<{ id: string; name: string; avatar: Avatar; yearGroup: string; familyId: string } | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/onboarding');
      const data = await res.json();

      if (!res.ok) {
        // Not authenticated, redirect to login
        router.push('/auth/login');
        return;
      }

      if (!data.needsOnboarding) {
        // Already has children, redirect to parent dashboard
        router.push('/parent');
        return;
      }

      // Ready for onboarding
      setStep('name');
    } catch (err) {
      router.push('/auth/login');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pinStep === 'enter') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setPinStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const newPin = confirmPin + digit;
        setConfirmPin(newPin);
        if (newPin.length === 4) {
          if (newPin === pin) {
            // PINs match, save the child
            saveChild(newPin);
          } else {
            // PINs don't match, reset
            setError('PINs don\'t match. Try again.');
            setTimeout(() => {
              setConfirmPin('');
              setPinStep('enter');
              setPin('');
              setError('');
            }, 1500);
          }
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (pinStep === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const saveChild = async (finalPin: string) => {
    setStep('saving');
    setError('');

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child: {
            name: childName,
            age: parseInt(age),
            yearGroup,
            learningMode,
            avatar,
            pin: finalPin,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save. Please try again.');
        setStep('pin');
        setPin('');
        setConfirmPin('');
        setPinStep('enter');
        return;
      }

      setSavedChild({
        id: data.child.id,
        name: data.child.name,
        avatar: data.child.avatar,
        yearGroup: data.child.yearGroup,
        familyId: data.familyId,
      });
      
      setStep('complete');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStep('pin');
      setPin('');
      setConfirmPin('');
      setPinStep('enter');
    }
  };

  const handleStartLearning = () => {
    if (savedChild) {
      // Set child session for immediate learning
      setChildSession({
        childId: savedChild.id,
        childName: savedChild.name,
        avatar: savedChild.avatar,
        yearGroup: savedChild.yearGroup,
        familyId: savedChild.familyId,
        loginAt: new Date().toISOString(),
      });
      router.push('/learn');
    }
  };

  const steps: OnboardingStep[] = ['name', 'details', 'avatar', 'pin', 'complete'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-navy relative flex items-center justify-center px-4 py-8">
      <Starfield />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">✨</span>
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Luminary
            </span>
          </Link>
        </div>

        {/* Progress bar */}
        {step !== 'complete' && step !== 'loading' && step !== 'saving' && (
          <div className="flex items-center gap-2 mb-8 px-4">
            {steps.slice(0, -1).filter(s => s !== 'loading' && s !== 'saving').map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= currentStepIndex - 1 ? 'bg-amber' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8 text-center"
            >
              <div className="w-12 h-12 border-4 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-light/70">Loading...</p>
            </motion.div>
          )}

          {/* Saving State */}
          {step === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8 text-center"
            >
              <div className="w-12 h-12 border-4 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Creating {childName}&apos;s profile...</p>
              <p className="text-slate-light/70 text-sm">Setting up their learning universe</p>
            </motion.div>
          )}

          {/* Step 1: Child's Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Let&apos;s add your first learner
              </h2>
              <p className="text-slate-light/70 text-center mb-6">What&apos;s your child&apos;s first name?</p>

              <form onSubmit={(e) => { e.preventDefault(); setStep('details'); }} className="space-y-5">
                <Input
                  placeholder="e.g. Oliver"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  className="text-center text-lg"
                />
                <Button type="submit" variant="primary" size="lg" className="w-full gap-2">
                  Continue <ArrowRight size={18} />
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => setStep('name')}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Tell us about {childName}
              </h2>
              <p className="text-slate-light/70 text-center mb-6">This helps us personalise their learning</p>

              <form onSubmit={(e) => { e.preventDefault(); setStep('avatar'); }} className="space-y-5">
                <Input
                  label="Age"
                  type="number"
                  min={5}
                  max={16}
                  placeholder="5-16"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-light mb-2">Year Group</label>
                  <select
                    value={yearGroup}
                    onChange={(e) => setYearGroup(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-navy/60 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber/50 transition-all duration-300 appearance-none"
                  >
                    <option value="" disabled>Select year group</option>
                    {YEAR_GROUPS.map((yg) => (
                      <option key={yg} value={yg} className="bg-navy-light text-white">{yg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-light mb-3">Learning Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLearningMode('full_homeschool')}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        learningMode === 'full_homeschool'
                          ? 'border-amber bg-amber/10 text-amber'
                          : 'border-white/10 text-slate-light/70 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">🏠</div>
                      <div className="text-sm font-semibold">Full Homeschool</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLearningMode('school_supplement')}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        learningMode === 'school_supplement'
                          ? 'border-amber bg-amber/10 text-amber'
                          : 'border-white/10 text-slate-light/70 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">🏫</div>
                      <div className="text-sm font-semibold">School Supplement</div>
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full gap-2">
                  Continue <ArrowRight size={18} />
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 3: Avatar */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => setStep('details')}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Choose {childName}&apos;s avatar
              </h2>
              <p className="text-slate-light/70 text-center mb-6">Pick a learning companion</p>

              <div className="grid grid-cols-5 gap-3 mb-8">
                {AVATARS.map((a) => (
                  <motion.button
                    key={a.value}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAvatar(a.value)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      avatar === a.value
                        ? 'border-amber bg-amber/10 shadow-lg shadow-amber/20'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-3xl">{a.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-light/70">{a.label}</span>
                  </motion.button>
                ))}
              </div>

              <Button onClick={() => setStep('pin')} variant="primary" size="lg" className="w-full gap-2">
                Continue <ArrowRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* Step 4: PIN Setup */}
          {step === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8"
            >
              <button
                onClick={() => { setStep('avatar'); setPin(''); setConfirmPin(''); setPinStep('enter'); setError(''); }}
                className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2
                className="text-2xl font-bold text-white mb-2 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {pinStep === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
              </h2>
              <p className="text-slate-light/70 text-center mb-6">
                {pinStep === 'enter'
                  ? `This is ${childName}'s secret code to log in`
                  : 'Enter the same PIN again to confirm'}
              </p>

              {/* PIN dots */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((i) => {
                  const currentPin = pinStep === 'enter' ? pin : confirmPin;
                  return (
                    <motion.div
                      key={i}
                      className={`w-5 h-5 rounded-full transition-all duration-300 ${
                        i < currentPin.length ? 'bg-amber scale-110' : 'bg-white/20'
                      }`}
                      animate={i < currentPin.length ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.2 }}
                    />
                  );
                })}
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

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

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check size={40} className="text-emerald" />
              </motion.div>

              <h2
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                All set!
              </h2>
              <p className="text-slate-light/70 mb-2">
                {childName}&apos;s learning universe is ready
              </p>
              <div className="flex items-center justify-center gap-2 text-amber mb-8">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">
                  {AVATARS.find(a => a.value === avatar)?.emoji} {childName} the {AVATARS.find(a => a.value === avatar)?.label}
                </span>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleStartLearning}
                  variant="primary"
                  size="lg"
                  className="w-full gap-2"
                >
                  Start Learning <ArrowRight size={18} />
                </Button>
                <Button
                  onClick={() => router.push('/parent')}
                  variant="ghost"
                  size="md"
                  className="w-full"
                >
                  Go to Parent Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
