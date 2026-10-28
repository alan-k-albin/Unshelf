'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Briefcase, Wrench, Sparkles, ShieldAlert } from 'lucide-react';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';
import { useUserRestrictions } from '@/lib/useUserRestrictions';
import { Toast, useToast } from '@/components/Toast';

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
  const restrictions = useUserRestrictions();
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState(true); // assume verified until we know otherwise

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

  useEffect(() => {
    if (!restrictions.loading) {
      if (!restrictions.can_offer_service && restrictions.can_request_service && formData.service_type === 'offering') {
        setFormData((prev) => ({ ...prev, service_type: 'seeking' }));
      } else if (!restrictions.can_request_service && restrictions.can_offer_service && formData.service_type === 'seeking') {
        setFormData((prev) => ({ ...prev, service_type: 'offering' }));
      }
    }
  }, [restrictions.loading, restrictions.can_offer_service, restrictions.can_request_service, formData.service_type]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    setIsVerified(!!user?.is_verified);
  }, []);

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

      // Only offering a paid service requires a verified account.
      // Requesting a service is open to everyone, verified or not.
      if (formData.service_type === 'offering' && !isVerified) {
        setError('Posting a paid service offer requires a verified institution account. You can still post a service request instead.');
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

      if (restrictions.is_banned) {
        showToast('Your account is suspended.', 'error');
        setError('Your account is suspended.');
        setLoading(false);
        return;
      }

      if (formData.service_type === 'offering' && !restrictions.can_offer_service) {
        showToast('Offering services is disabled on your account.', 'error');
        setError('Offering services is disabled on your account.');
        setLoading(false);
        return;
      }

      if (formData.service_type === 'seeking' && !restrictions.can_request_service) {
        showToast('Requesting services is disabled on your account.', 'error');
        setError('Requesting services is disabled on your account.');
        setLoading(false);
        return;
      }

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
        if (
          insertError.message &&
          (insertError.message.toLowerCase().startsWith('restricted:') ||
            insertError.message.toLowerCase().includes('restricted:'))
        ) {
          showToast(insertError.message, 'error');
        } else {
          setError(
            insertError.message.includes('row-level security') || insertError.message.includes('policy')
              ? 'Posting a paid service offer requires a verified institution account.'
              : `Failed to post service: ${insertError.message}`
          );
        }
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
    <div className="min-h-screen bg-[#FBF8F1] font-body">
      <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-[#1B2A4A]">
              {isOffering ? 'Offer a Student Service' : 'Request a Student Service'}
            </h1>
            <p className="text-xs text-[#8A8272]">
              {isOffering
                ? 'Share your skills, tutoring, or practical assistance with peers'
                : 'Ask campus peers for tutoring, coding, or academic assistance'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

        {restrictions.is_banned && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#FEF2F2] border-[#FECACA]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#B23A2E]" />
            <div>
              <p className="text-sm font-semibold text-[#B23A2E]">
                Your account is suspended.
              </p>
              <p className="text-xs text-[#5B5647] mt-0.5">
                Posting, requesting, and chatting are currently disabled on your account.
              </p>
            </div>
          </div>
        )}

        {isOffering && !isVerified && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-amber-50 border-amber-200">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <p className="text-xs text-amber-800">
              Your account isn't verified yet, so you can't post a paid service offer. You can still
              switch to "Request a Service" below, or get your institution verified to unlock offering.
            </p>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-3">
              I want to: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!restrictions.can_offer_service) {
                    showToast('Offering services is disabled on your account.', 'error');
                    return;
                  }
                  setFormData((prev) => ({ ...prev, service_type: 'offering' }));
                }}
                disabled={!restrictions.can_offer_service}
                className={`p-3.5 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  !restrictions.can_offer_service
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    : isOffering
                    ? 'border-[#27AE60] bg-[#F0FDF4] text-[#1E7E45] shadow-xs'
                    : 'border-[#EDE6D6] bg-white text-[#5B5647] hover:border-[#1B2A4A]/40'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Offer a Service</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!restrictions.can_request_service) {
                    showToast('Requesting services is disabled on your account.', 'error');
                    return;
                  }
                  setFormData((prev) => ({ ...prev, service_type: 'seeking' }));
                }}
                disabled={!restrictions.can_request_service}
                className={`p-3.5 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  !restrictions.can_request_service
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    : !isOffering
                    ? 'border-[#B45309] bg-[#FFFBEB] text-[#B45309] shadow-xs'
                    : 'border-[#EDE6D6] bg-white text-[#5B5647] hover:border-[#1B2A4A]/40'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Request a Service</span>
              </button>
            </div>
            {!restrictions.can_offer_service && (
              <p className="text-[11px] text-[#B23A2E] mt-1.5 font-medium">
                ⚠️ Offering services is disabled on your account.
              </p>
            )}
            {!restrictions.can_request_service && (
              <p className="text-[11px] text-[#B23A2E] mt-1.5 font-medium">
                ⚠️ Requesting services is disabled on your account.
              </p>
            )}
            <p className="text-xs text-[#8A8272] mt-2.5">
              {isOffering
                ? '💡 You are advertising a service you can provide to other students.'
                : '💡 You are looking for a peer who can help you with a service.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
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
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
            <p className="text-xs text-[#8A8272] mt-1.5">{formData.title.length}/120 characters</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            >
              <option value="">Select a category</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
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
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rate: preset }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                    formData.rate === preset
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                      : 'bg-[#FAF6EE] text-[#5B5647] border-[#EDE6D6] hover:border-[#1B2A4A]/40'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2A4A] mb-3">
              Relevant Branch & Semester <span className="text-xs font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5B5647] mb-1 font-semibold">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-xs bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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
                <label className="block text-xs text-[#5B5647] mb-1 font-semibold">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-xs bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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

          <div className="bg-white p-5 rounded-2xl border border-[#EDE6D6] shadow-xs">
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
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] resize-none focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            />
            <p className="text-xs text-[#8A8272] mt-1">{formData.description.length}/1000 characters</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6] flex gap-3">
            <Sparkles className="w-5 h-5 text-[#27AE60] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5B5647] leading-relaxed">
              <strong className="text-[#1B2A4A]">Campus Community Guidelines:</strong> Services on Unshelf are provided by and for students. Please keep interactions respectful, coordinate directly via chat, and agree on deliverables upfront.
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              (isOffering && !isVerified) ||
              restrictions.is_banned ||
              (isOffering && !restrictions.can_offer_service) ||
              (!isOffering && !restrictions.can_request_service)
            }
            className="w-full min-h-[48px] py-3.5 px-4 rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98] shadow-xs cursor-pointer"
          >
            {restrictions.is_banned ? (
              'Your account is suspended'
            ) : isOffering && !restrictions.can_offer_service ? (
              'Offering services is disabled on your account'
            ) : !isOffering && !restrictions.can_request_service ? (
              'Requesting services is disabled on your account'
            ) : loading ? (
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
