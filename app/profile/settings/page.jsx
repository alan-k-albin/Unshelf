'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Bell, Shield, LogOut, ChevronRight, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    router.push('/login');
  };

  const settingsItems = [
    {
      section: 'Account',
      items: [
        {
          icon: <Edit2 className="w-5 h-5" style={{ color: '#1877F2' }} />,
          label: 'Edit Profile',
          description: 'Update your name, department, semester',
          action: () => router.push('/profile/edit'),
        },
      ],
    },
    {
      section: 'About',
      items: [
        {
          icon: <Info className="w-5 h-5" style={{ color: '#6B7280' }} />,
          label: 'About Unshelf',
          description: 'Version 1.0 • SJCET Campus Marketplace',
          action: null,
        },
        {
          icon: <Shield className="w-5 h-5" style={{ color: '#6B7280' }} />,
          label: 'Privacy Policy',
          description: 'How we handle your data',
          action: null,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
            Settings
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {settingsItems.map((section) => (
          <div key={section.section}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.section}
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={item.action || undefined}
                  disabled={!item.action}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left transition
                    ${idx !== 0 ? 'border-t border-gray-100' : ''}
                    ${item.action ? 'hover:bg-gray-50 active:bg-gray-100' : 'opacity-70 cursor-default'}
                  `}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  {item.action && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-red-50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Logout</p>
                <p className="text-xs text-gray-500 mt-0.5">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
        }
