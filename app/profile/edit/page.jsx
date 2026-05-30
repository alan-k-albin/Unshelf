'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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
    whatsapp_number: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      const userData = JSON.parse(userStr);

      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (dbUser) {
        setFormData({
          full_name: dbUser.full_name || '',
          department: dbUser.department || '',
          semester: dbUser.semester || '',
          whatsapp_number: dbUser.whatsapp_number || '',
        });
      }
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
    if (!formData.whatsapp_number || formData.whatsapp_number.length !== 10) {
      setError('Enter a valid 10-digit WhatsApp number');
      return;
    }

    setSaving(true);
    try {
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name.trim(),
          department: formData.department,
          semester: formData.semester,
          whatsapp_number: formData.whatsapp_number,
        })
        .eq('email', userData.email);

      if (updateError) throw updateError;

      // Update localStorage too
      const updatedUser = {
        ...userData,
        fullName: formData.full_name.trim(),
        full_name: formData.full_name.trim(),
        department: formData.department,
        semester: formData.semester,
        whatsapp: formData.whatsapp_number,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin" style={{ color: '#1877F2' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
            Edit Profile
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {error && (
          <div className="p-4 rounded-xl flex gap-3 border border-red-200 bg-red-50">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl flex gap-3 border border-green-200 bg-green-50">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            Full Name *
          </label>
          <input
            type="text"
            name="full_name"
            placeholder="Your full name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            style={{ color: '#1B2A4A' }}
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            Department *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            style={{ color: '#1B2A4A' }}
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            Semester *
          </label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            style={{ color: '#1B2A4A' }}
          >
            <option value="">Select Semester</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={`S${s}`}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            WhatsApp Number *
          </label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="whatsapp_number"
              placeholder="9876543210"
              value={formData.whatsapp_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  whatsapp_number: e.target.value.replace(/\D/g, ''),
                }))
              }
              maxLength="10"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              style={{ color: '#1B2A4A' }}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
        >
          {saving ? (
            <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
    }
