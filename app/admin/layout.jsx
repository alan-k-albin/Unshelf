'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  Flag,
  FileText,
  Users,
  ShieldCheck,
  ArrowLeft,
  Loader,
} from 'lucide-react';

const ADMIN_TABS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
          if (mounted) router.replace('/');
          return;
        }

        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', authData.user.id)
          .single();

        if (userError || !userRow?.is_admin) {
          if (mounted) router.replace('/');
          return;
        }

        if (mounted) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch (err) {
        console.error('Admin verification error:', err);
        if (mounted) router.replace('/');
      }
    }

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  // If not admin, redirect to / and render nothing until the check finishes
  if (checking || !authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body text-[#1B2A4A] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#1B2A4A] text-white sticky top-0 z-40 border-b border-[#1B2A4A]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Unshelf
              </span>
              <span className="bg-[#27AE60] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-[#EDE6D6] hover:text-white flex items-center gap-1.5 transition py-1.5 px-3 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Campus Site</span>
            </Link>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1.5 border-t border-white/10">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#1B2A4A] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
