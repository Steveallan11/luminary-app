'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Image as ImageIcon, AlertTriangle, BarChart3, FileText, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/lessons', label: 'Lessons', icon: <BookOpen size={18} /> },
  { href: '/admin/content', label: 'Content', icon: <ImageIcon size={18} /> },
  { href: '/admin/images', label: 'Images', icon: <ImageIcon size={18} /> },
  { href: '/admin/safety', label: 'Safety', icon: <AlertTriangle size={18} /> },
  { href: '/admin/performance', label: 'Performance', icon: <BarChart3 size={18} /> },
  { href: '/admin/reports', label: 'Reports', icon: <FileText size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-navy/80 backdrop-blur border-r border-white/10 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {sidebarOpen && <h1 className="font-black text-white text-lg">Luminary</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-amber/20 text-amber'
                  : 'text-slate-light/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
