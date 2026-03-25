import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Wand2, BookOpen, Image, FileText, Shield, Activity, Library, Users } from 'lucide-react';
import { isAdminAuthenticated, getAdminSessionEmail } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    redirect('/auth/login?mode=admin');
  }

  const adminEmail = await getAdminSessionEmail();

  const navItems = [
    { href: '/admin/lessons', label: 'Lessons', icon: BookOpen },
    { href: '/admin/library', label: 'Library', icon: Library },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/images', label: 'Images', icon: Image },
    { href: '/admin/reports', label: 'Reports', icon: FileText },
    { href: '/admin/safety', label: 'Safety', icon: Shield },
    { href: '/admin/performance', label: 'Performance', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-white/10 bg-navy-dark/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Luminary
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber/20 text-amber font-bold">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-slate-light/60 hover:text-white hover:bg-white/5"
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-light/40">Signed in as</p>
              <p className="text-sm text-white font-semibold">{adminEmail}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
