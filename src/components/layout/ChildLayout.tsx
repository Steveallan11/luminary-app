'use client';

import Starfield from '@/components/ui/Starfield';
import ChildNav from '@/components/layout/ChildNav';

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy relative">
      <Starfield />
      <ChildNav />
      <main className="relative z-10 lg:ml-20 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
