'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Brain, Map, BarChart3, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import { MOCK_SUBJECTS } from '@/lib/mock-data';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const features = [
  {
    icon: Brain,
    title: 'AI Tutor — Lumi',
    description: 'A warm, intelligent AI companion that adapts to your child\'s learning style, pace, and interests.',
    color: '#F59E0B',
  },
  {
    icon: Map,
    title: 'Learning Maps',
    description: 'Visual, connected learning journeys across 15 subjects — from English and Maths to AI Literacy and Coding.',
    color: '#38BDF8',
  },
  {
    icon: BarChart3,
    title: 'Parent Insight',
    description: 'Real-time dashboards showing progress, streaks, and mastery — so you always know how your child is doing.',
    color: '#10B981',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy relative overflow-hidden">
      <Starfield />

      {/* Navigation */}
      <header className="relative z-20 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Luminary
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="primary" size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles size={14} className="text-amber" />
              <span className="text-sm text-amber font-semibold">UK Curriculum Aligned</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Learning that{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber to-sky">
              lights up
            </span>{' '}
            every child
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-slate-light/80 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            An AI-powered homeschooling platform for UK children aged 5–16.
            Personalised lessons, visual learning maps, and a tutor that truly understands your child.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/auth/signup">
              <Button variant="primary" size="lg" className="gap-2">
                Start Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everything your child needs to thrive
            </h2>
            <p className="text-slate-light/70 max-w-xl mx-auto">
              Built by educators and parents, powered by the latest in AI technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-8 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    boxShadow: `0 0 20px ${feature.color}10`,
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon size={24} style={{ color: feature.color }} />
                  </div>
                  <h3
                    className="text-xl font-bold text-white mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-slate-light/70 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subject Preview */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              15 subjects. One universe.
            </h2>
            <p className="text-slate-light/70 max-w-xl mx-auto">
              From traditional curriculum to future-ready skills — all in one beautiful place.
            </p>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {MOCK_SUBJECTS.map((subject, i) => (
                <motion.div
                  key={subject.slug}
                  className="flex-shrink-0 w-40 sm:w-48 rounded-2xl p-4 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${subject.colour_hex}15 0%, #112069 100%)`,
                    boxShadow: `0 0 15px ${subject.colour_hex}10`,
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <div className="text-2xl mb-2">{subject.icon_emoji}</div>
                  <h4 className="text-sm font-bold text-white mb-1">{subject.name}</h4>
                  <p className="text-xs text-slate-light/60 line-clamp-2">{subject.description}</p>
                  {subject.is_future_skill && (
                    <div className="mt-2 inline-flex items-center gap-1 text-amber text-[10px] font-bold">
                      <Sparkles size={10} />
                      Future Skill
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="rounded-3xl bg-navy-light/40 backdrop-blur-sm border border-white/10 p-8 sm:p-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h3
              className="text-2xl sm:text-3xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              126,000+ UK children homeschooled and counting
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-light/70">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald" />
                <span>No ads. Ever.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald" />
                <span>Your child&apos;s data is never sold.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to begin the adventure?
            </h2>
            <p className="text-slate-light/70 mb-8 max-w-lg mx-auto">
              Set up your family in under 2 minutes. No credit card required.
            </p>
            <Link href="/auth/signup">
              <Button variant="primary" size="lg" className="gap-2">
                Start Free Today <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✨</span>
                <span
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Luminary
                </span>
              </div>
              <p className="text-sm text-slate-light/60">
                AI-powered homeschooling for UK families. Making learning an adventure.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-light/60">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Subjects</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-slate-light/60">
                <li><Link href="#" className="hover:text-white transition-colors">Help Centre</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-light/60">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-slate-light/40">
            &copy; {new Date().getFullYear()} Luminary Education Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
