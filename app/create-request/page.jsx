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
    <div className="min-h-screen bg-[#FBF8F1] font-body">
      {/* Top Bar */}
      <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-[#1B2A4A]">
              Request Study Material
            </h1>
            <p className="text-xs text-[#8A8272]">Ask campus peers for books, notes, or tools</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {error && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#F0FDF4] border-[#BBF7D0]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#27AE60]" />
            <p className="text-sm font-medium text-[#27AE60]">
              {success}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-[#EDE6D6] shadow-xs space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              What material do you need? *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Engineering Mathematics 1 (Erwin Kreyszig)"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
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
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Subject / Topic <span className="font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., Data Structures, Thermodynamics"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
          </div>

          {/* Target Department & Semester */}
          <div className="p-4 rounded-xl border border-[#EDE6D6] bg-[#FAF6EE] space-y-3">
            <p className="text-sm font-semibold text-[#1B2A4A]">
              Department & Semester <span className="font-normal text-[#8A8272]">(Optional)</span>
            </p>
            <p className="text-xs text-[#8A8272] -mt-1">
              Specifying your department or semester helps seniors and classmates spot your request faster.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#5B5647]">Department</label>
                <select
                  name="targetDepartment"
                  value={formData.targetDepartment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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
                <label className="block text-xs font-semibold mb-1 text-[#5B5647]">Semester</label>
                <select
                  name="targetSemester"
                  value={formData.targetSemester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
              How urgently is it needed? *
            </label>
            <div className="space-y-2">
              {URGENCIES.map((urg) => {
                const isSelected = formData.urgency === urg.value;
                return (
                  <label
                    key={urg.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-[#1B2A4A] bg-[#FAF6EE] shadow-xs'
                        : 'border-[#EDE6D6] bg-white hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={urg.value}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#1B2A4A]"
                    />
                    <span className="text-sm font-medium text-[#1B2A4A]">
                      {urg.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Additional Details <span className="font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Any specific author, edition, condition preference, or when you need it by..."
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              maxLength={500}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] resize-none focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
            <p className="text-xs text-[#8A8272] text-right mt-1">
              {formData.description.length} / 500 characters
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] py-3.5 rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98] shadow-xs"
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
