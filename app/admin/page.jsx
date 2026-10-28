'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  ShieldAlert,
  ShoppingBag,
  HelpCircle,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Loader,
} from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loadStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data, error } = await supabase.rpc('admin_stats');
      if (error) throw error;
      setStats(data || {});
      if (isManual) showToast('Dashboard stats updated');
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      showToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      id: 'open_reports',
      label: 'Open Reports',
      value: stats?.open_reports ?? 0,
      icon: AlertTriangle,
      color: '#B23A2E',
      bg: '#FEF2F2',
      border: '#FECACA',
      description: 'Pending student reports needing review',
      href: '/admin/reports',
      highlight: (stats?.open_reports ?? 0) > 0,
    },
    {
      id: 'restricted_users',
      label: 'Restricted Users',
      value: stats?.restricted_users ?? 0,
      icon: ShieldAlert,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      description: 'Users with posting, chat, or login limits',
      href: '/admin/users',
      highlight: false,
    },
    {
      id: 'users',
      label: 'Total Users',
      value: stats?.users ?? 0,
      icon: Users,
      color: '#1B2A4A',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      description: 'Registered SJCET college accounts',
      href: '/admin/users',
      highlight: false,
    },
    {
      id: 'listings',
      label: 'Active Listings',
      value: stats?.listings ?? 0,
      icon: ShoppingBag,
      color: '#27AE60',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      description: 'Textbooks & academic items for sale',
      href: '/admin/content',
      highlight: false,
    },
    {
      id: 'requests',
      label: 'Material Requests',
      value: stats?.requests ?? 0,
      icon: HelpCircle,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      description: 'Student requests for books & records',
      href: '/admin/content',
      highlight: false,
    },
    {
      id: 'services',
      label: 'Student Services',
      value: stats?.services ?? 0,
      icon: Briefcase,
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      description: 'Peer tutoring, assistance & skill offers',
      href: '/admin/content',
      highlight: false,
    },
    {
      id: 'conversations',
      label: 'Conversations',
      value: stats?.conversations ?? 0,
      icon: MessageSquare,
      color: '#4B5563',
      bg: '#F3F4F6',
      border: '#E5E7EB',
      description: 'Direct messages across campus peers',
      href: '/admin/reports',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE6D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A]">
            Campus Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#5B5647] font-body mt-0.5">
            Real-time monitoring and moderation dashboard for SJCET Unshelf
          </p>
        </div>

        <button
          onClick={() => loadStats(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#1B2A4A] transition shadow-xs active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-3" />
          <p className="text-sm font-body text-[#8A8272]">Loading admin stats...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className={`group relative p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white ${
                    card.highlight
                      ? 'border-[#B23A2E] ring-2 ring-[#B23A2E]/20'
                      : 'border-[#EDE6D6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: card.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8A8272]">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  <p className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A] tracking-tight">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-sm font-semibold text-[#1B2A4A] mt-1 font-body">
                    {card.label}
                  </p>
                  <p className="text-xs text-[#8A8272] mt-1 font-body line-clamp-1">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Quick Action Navigation Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <Link
              href="/admin/reports"
              className="p-5 rounded-2xl bg-white border border-[#EDE6D6] hover:border-[#B23A2E] transition shadow-xs hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#B23A2E]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-base text-[#1B2A4A] group-hover:text-[#B23A2E] transition">
                  Review Reports
                </h3>
              </div>
              <p className="text-xs text-[#5B5647] font-body leading-relaxed">
                Take action on student-submitted flags, remove infringing items, and resolve tickets.
              </p>
            </Link>

            <Link
              href="/admin/content"
              className="p-5 rounded-2xl bg-white border border-[#EDE6D6] hover:border-[#27AE60] transition shadow-xs hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#27AE60]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-base text-[#1B2A4A] group-hover:text-[#27AE60] transition">
                  Moderate Content
                </h3>
              </div>
              <p className="text-xs text-[#5B5647] font-body leading-relaxed">
                Search, inspect, and toggle visibility for all listings, requests, and service posts.
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="p-5 rounded-2xl bg-white border border-[#EDE6D6] hover:border-[#1B2A4A] transition shadow-xs hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-[#1B2A4A]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-base text-[#1B2A4A] transition">
                  User Permissions
                </h3>
              </div>
              <p className="text-xs text-[#5B5647] font-body leading-relaxed">
                Manage restrictions for selling, chatting, requests, and account suspension.
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
