import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌌</div>
        <h1
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Lost in Space!
        </h1>
        <p className="text-slate-light/60 mb-8">
          This page doesn&apos;t exist yet. Let&apos;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/learn"
            className="px-6 py-3 rounded-xl bg-electric text-white font-semibold hover:bg-electric/90 transition-colors"
          >
            Start Learning
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
