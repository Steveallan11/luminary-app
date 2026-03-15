'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Star, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/learn', icon: Home, label: 'Home' },
  { href: '/progress', icon: Star, label: 'Progress' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function ChildNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 bg-navy-light/50 backdrop-blur-md border-r border-white/10 z-50">
        <div className="text-2xl mb-8">✨</div>
        <nav className="flex flex-col gap-6 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/learn' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-amber/20 text-amber'
                    : 'text-slate-mid hover:text-white hover:bg-white/10'
                )}
              >
                <Icon size={22} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-light/90 backdrop-blur-md border-t border-white/10 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/learn' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-300 min-w-[56px]',
                  isActive
                    ? 'text-amber'
                    : 'text-slate-mid hover:text-white'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
