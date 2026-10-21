'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Shield, LogOut, ChevronRight, Info, Users } from 'lucide-react';
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
          icon: <Edit2 className="w-5 h-5 text-[#1B2A4A]" />,
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
          icon: <Info className="w-5 h-5 text-[#8A8272]" />,
          label: 'About Unshelf',
          description: 'Version 1.0 • SJCET Campus Marketplace',
          action: null,
        },
        {
          icon: <Users className="w-5 h-5 text-[#8A8272]" />,
          label: 'Developed by Alan K Albin',
          description: 'Built by a student, for students.',
          action: null,
        },
        {
          icon: <Shield className="w-5 h-5 text-[#8A8272]" />,
          label: 'Privacy Policy',
          description: 'How we handle your data',
          action: null,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body pb-24">
      {/* Header */}
      <div className="bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">
            Settings
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {settingsItems.map((section) => (
          <div key={section.section}>
            <p className="text-xs font-bold text-[#8A8272] uppercase tracking-wider mb-2 px-1">
              {section.section}
            </p>
            <div className="bg-white rounded-2xl border border-[#EDE6D6] shadow-xs overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={item.action || undefined}
                  disabled={!item.action}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition
                    ${idx !== 0 ? 'border-t border-[#EDE6D6]/60' : ''}
                    ${item.action ? 'hover:bg-[#FAF6EE] active:bg-[#F3EEDC]' : 'opacity-70 cursor-default'}
                  `}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B2A4A]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#8A8272] mt-0.5">{item.description}</p>
                  </div>
                  {item.action && <ChevronRight className="w-4 h-4 text-[#8A8272] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div>
          <div className="bg-white rounded-2xl border border-[#EDE6D6] shadow-xs overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-red-50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Logout</p>
                <p className="text-xs text-[#8A8272] mt-0.5">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
