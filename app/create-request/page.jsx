'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';
import { CATEGORIES } from '@/app/data';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const URGENCIES = [
  { value: 'Low', label: '🟢 Low — Anytime this semester', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 'Medium', label: '🟡 Medium — Needed in 1–2 weeks', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'High', label: '🔴 High — Needed urgently (exam/lab)', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
];

export default function CreateRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    targetDepartment: '',
    targetSemester: '',
    subject: '',
    urgency: 'Medium',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Title is required (e.g., Physics Lab Manual S2)');
        setLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      if (!authUserId) {
        setError('You must be logged in to create a material request');
        setLoading(false);
        return;
      }

      // Check rate limit (shared with listings)
      const rateLimit = await checkRateLimit(authUserId, 'CREATE_LISTING');
      if (!rateLimit.allowed) {
        setError(rateLimit.message);
        setLoading(false);
        return;
      }

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const { data: insertData, error: insertError } = await supabase
        .from('requests')
        .insert([
          {
            user_id: authUserId,
            title: formData.title.trim(),
            category: formData.category,
            department: formData.targetDepartment || user?.department || '',
            semester: formData.targetSemester || user?.semester || '',
            subject: formData.subject ? formData.subject.trim() : null,
            urgency: formData.urgency || 'Medium',
            description: formData.description ? formData.description.trim() : null,
            status: 'open',
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        setError(`Failed to create request: ${insertError.message}`);
        setLoading(false);
        return;
      }

      await recordAction(authUserId, 'CREATE_LISTING', {
        title: formData.title,
        type: 'request',
      });

      setSuccess('✓ Material request posted successfully!');
      setTimeout(() => {
        if (insertData?.id) {
          router.push(`/request/${insertData.id}`);
        } else {
          router.push('/search?type=requests');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
              Request Study Material
            </h1>
            <p className="text-xs text-gray-500">Ask campus peers for books, notes, or tools</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {error && (
          <div
            className="mb-5 p-4 rounded-xl flex gap-3 border"
            style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            className="mb-5 p-4 rounded-xl flex gap-3 border"
            style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
            <p className="text-sm font-medium" style={{ color: '#16A34A' }}>
              {success}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
              What material do you need? *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Engineering Mathematics 1 (Erwin Kreyszig)"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
              Subject / Topic <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., Data Structures, Thermodynamics"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Department & Semester */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
            <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
              Department & Semester <span className="font-normal text-gray-400">(Optional)</span>
            </p>
            <p className="text-xs text-gray-500 -mt-1">
              Specifying your department or semester helps seniors and classmates spot your request faster.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-600">Department</label>
                <select
                  name="targetDepartment"
                  value={formData.targetDepartment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Any Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-600">Semester</label>
                <select
                  name="targetSemester"
                  value={formData.targetSemester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Any Semester</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={`S${s}`}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              How urgently is it needed? *
            </label>
            <div className="space-y-2">
              {URGENCIES.map((urg) => {
                const isSelected = formData.urgency === urg.value;
                return (
                  <label
                    key={urg.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                      isSelected ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={urg.value}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium" style={{ color: '#1B2A4A' }}>
                      {urg.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
              Additional Details <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Any specific author, edition, condition preference, or when you need it by..."
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {formData.description.length} / 500 characters
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Posting Request...
              </>
            ) : (
              'Post Material Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
