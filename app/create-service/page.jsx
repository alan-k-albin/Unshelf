'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Briefcase, Wrench, Sparkles } from 'lucide-react';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT', 'Any / General'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Any / General'];

const SERVICE_CATEGORIES = [
  'Tutoring & Teaching',
  'Assignment Help',
  'Lab Record & Practical Help',
  'Project Assistance',
  'Proofreading & Editing',
  'Coding & Tech Support',
  'Design & Presentation',
  'Other Academic Service',
];

const RATE_PRESETS = [
  'Free / Peer Help',
  '₹100/hr',
  '₹200/hr',
  '₹300 flat',
  '₹500 flat',
  'Negotiable',
];

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('service_type') === 'seeking' ? 'seeking' : 'offering';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    service_type: initialType,
    title: '',
    category: '',
    rate: '',
    department: '',
    semester: '',
    description: '',
  });

  useEffect(() => {
    const typeParam = searchParams.get('service_type');
    if (typeParam === 'seeking' || typeParam === 'offering') {
      setFormData((prev) => ({ ...prev, service_type: typeParam }));
    }
  }, [searchParams]);

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
        setError('Title is required (e.g., Python & DSA Tutoring for S3)');
        setLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a service category');
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      if (!authUserId) {
        setError('You must be logged in to post a student service');
        setLoading(false);
        return;
      }

      // Check rate limit (shared with listings/requests)
      const rateLimit = await checkRateLimit(authUserId, 'CREATE_LISTING');
      if (!rateLimit.allowed) {
        setError(rateLimit.message);
        setLoading(false);
        return;
      }

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const { data: insertData, error: insertError } = await supabase
        .from('services')
        .insert([
          {
            user_id: authUserId,
            title: formData.title.trim(),
            service_type: formData.service_type,
            category: formData.category,
            rate: formData.rate.trim() || 'Negotiable',
            department: formData.department || user?.department || '',
            semester: formData.semester || user?.semester || '',
            description: formData.description ? formData.description.trim() : null,
            status: 'open',
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        setError(`Failed to post service: ${insertError.message}`);
        setLoading(false);
        return;
      }

      await recordAction(authUserId, 'CREATE_LISTING', {
        title: formData.title,
        type: 'service',
        service_type: formData.service_type,
      });

      setSuccess('✓ Service posted successfully!');
      setTimeout(() => {
        if (insertData?.id) {
          router.push(`/service/${insertData.id}`);
        } else {
          router.push('/search?type=services');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to post service');
    } finally {
      setLoading(false);
    }
  };

  const isOffering = formData.service_type === 'offering';

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 hover:bg-gray-100 rounded-full transition text-[#1B2A4A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-[#1B2A4A]">
              {isOffering ? 'Offer a Student Service' : 'Request a Student Service'}
            </h1>
            <p className="text-xs text-[#5B5647]">
              {isOffering
                ? 'Share your skills, tutoring, or practical assistance with peers'
                : 'Ask campus peers for tutoring, coding, or academic assistance'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {error && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#FEF2F2] border-[#FECACA]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <p className="text-sm font-medium text-[#DC2626]">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#F0FDF4] border-[#BBF7D0]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#16A34A]" />
            <p className="text-sm font-medium text-[#16A34A]">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type Toggle */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-3">
              I want to: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, service_type: 'offering' }))}
                className={`p-3.5 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  isOffering
                    ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D] shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Offer a Service</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, service_type: 'seeking' }))}
                className={`p-3.5 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  !isOffering
                    ? 'border-[#B45309] bg-[#FFFBEB] text-[#B45309] shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Request a Service</span>
              </button>
            </div>
            <p className="text-xs text-[#8A8272] mt-2.5">
              {isOffering
                ? '💡 You are advertising a service you can provide to other students.'
                : '💡 You are looking for a peer who can help you with a service.'}
            </p>
          </div>

          {/* Service Title */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-2">
              Service Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={
                isOffering
                  ? 'e.g. S3 DSA & Python 1-on-1 Tutoring / Lab Assistance'
                  : 'e.g. Need help with Digital Electronics Circuit simulation & records'
              }
              maxLength={120}
              className="w-full px-3.5 py-2.5 border-2 border-[#1B2A4A]/15 rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] transition text-[#1B2A4A]"
            />
            <p className="text-xs text-gray-400 mt-1.5">{formData.title.length}/120 characters</p>
          </div>

          {/* Category */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 border-2 border-[#1B2A4A]/15 rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] bg-white transition text-[#1B2A4A]"
            >
              <option value="">Select a category</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing / Rate */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-1">
              Rate / Pricing Model
            </label>
            <p className="text-xs text-[#8A8272] mb-3">
              Specify your expected rate, hourly fee, or mark as free / negotiable.
            </p>
            <input
              type="text"
              name="rate"
              value={formData.rate}
              onChange={handleInputChange}
              placeholder="e.g. ₹150/hr, Free, ₹300 flat, or Negotiable"
              className="w-full px-3.5 py-2.5 border-2 border-[#1B2A4A]/15 rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] transition text-[#1B2A4A] mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rate: preset }))}
                  className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                    formData.rate === preset
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                      : 'bg-[#F9F7F1] text-[#5B5647] border-[#EDE6D6] hover:border-[#1B2A4A]/40'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Context (Department & Semester) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-3">
              Relevant Branch & Semester <span className="text-xs font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#1B2A4A] bg-white text-[#1B2A4A]"
                >
                  <option value="">Any / General</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#1B2A4A] bg-white text-[#1B2A4A]"
                >
                  <option value="">Any / General</option>
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-2">
              Details & Description <span className="text-xs font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={
                isOffering
                  ? 'Describe your expertise, availability (e.g. weekdays after 4 PM, library sessions), tools you teach, or what students can expect.'
                  : 'Describe exactly what you need assistance with, deadlines, specific topics, or lab experiments.'
              }
              rows={4}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 border-2 border-[#1B2A4A]/15 rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] transition text-[#1B2A4A]"
            />
            <p className="text-xs text-gray-400 mt-1">{formData.description.length}/1000 characters</p>
          </div>

          {/* Notice */}
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex gap-3">
            <Sparkles className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1E40AF] leading-relaxed">
              <strong>Campus Community Guidelines:</strong> Services on Unshelf are provided by and for students. Please keep interactions respectful, coordinate directly via WhatsApp, and agree on deliverables upfront.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm transition hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
            style={{
              background: isOffering
                ? 'linear-gradient(135deg, #15803D, #166534)'
                : 'linear-gradient(135deg, #B45309, #92400E)',
            }}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Posting Service...
              </>
            ) : isOffering ? (
              'Publish Service Offering'
            ) : (
              'Publish Service Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
