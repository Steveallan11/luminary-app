'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/parent', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/parent?tab=children', icon: Users, label: 'Children' },
  { href: '/parent?tab=reports', icon: BarChart3, label: 'Reports' },
  { href: '/parent?tab=settings', icon: Settings, label: 'Settings' },
];

export default function ParentNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-navy-light/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/parent" className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Luminary
            </span>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/parent' && pathname === '/parent' && !item.href.includes('tab'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-amber/20 text-amber'
                      : 'text-slate-light hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-mid hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-white/5 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 p-2 text-slate-mid hover:text-amber transition-all"
            >
              <Icon size={18} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
