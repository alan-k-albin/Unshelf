'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEPT_MAP = {
  cs: 'CS', ecs: 'ECS', eee: 'EEE', me: 'ME',
  civil: 'Civil', mca: 'MCA', mba: 'MBA', ad: 'AD',
  ec: 'ECE', cy: 'CS CY',
};

const normalizeSemester = (sem) => {
  if (!sem) return '';
  const str = String(sem).trim();
  if (/^[1-8]$/.test(str)) return `S${str}`;
  return str;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    semester: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }
      }

      const userId = sessionUser?.id;
      if (!userId) {
        router.push('/login');
        return;
      }

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, full_name, department, semester, email')
        .eq('id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', dbError);
      }

      // If saved department is empty, preselect it from the email domain using DEPT_MAP
      const targetEmail = dbUser?.email || sessionUser?.email || '';
      let autoDept = '';
      const deptMatch = targetEmail.match(/@([a-z]{2,3})\./i);
      if (deptMatch && DEPT_MAP[deptMatch[1].toLowerCase()]) {
        autoDept = DEPT_MAP[deptMatch[1].toLowerCase()];
      }

      let localUser = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) localUser = JSON.parse(userStr);
      } catch (e) {
        // ignore parse error
      }

      setFormData({
        full_name: dbUser?.full_name || localUser?.full_name || localUser?.fullName || '',
        department: dbUser?.department || autoDept || localUser?.department || '',
        semester: normalizeSemester(dbUser?.semester || localUser?.semester || ''),
      });
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.department) {
      setError('Please select a department');
      return;
    }
    if (!formData.semester) {
      setError('Please select a semester');
      return;
    }

    setSaving(true);
    try {
      const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser();
      const userId = sessionUser?.id;

      if (authError || !userId) {
        setError('Session expired. Please log in again.');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name.trim(),
          department: formData.department,
          semester: formData.semester,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update localStorage too
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const updatedUser = {
          ...userData,
          fullName: formData.full_name.trim(),
          full_name: formData.full_name.trim(),
          department: formData.department,
          semester: formData.semester,
        };
        delete updatedUser.whatsapp;
        delete updatedUser.whatsapp_number;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center font-body">
        <Loader className="w-6 h-6 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }

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
            Edit Profile
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {error && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#F0FDF4] border-[#BBF7D0]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#27AE60]" />
            <p className="text-sm font-medium text-[#27AE60]">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-[#EDE6D6] shadow-xs space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="Your full name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-[#EDE6D6] text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-[#EDE6D6] text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Semester *
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-[#EDE6D6] text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            >
              <option value="">Select Semester</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={`S${s}`}>Semester {s} (S{s})</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98] shadow-xs"
          >
            {saving ? (
              <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
