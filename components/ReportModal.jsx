'use client';

import { useState } from 'react';
import { X, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';
import DOMPurify from 'dompurify';

const REPORT_REASONS = [
  { value: 'spam', label: '🔗 Spam or Duplicate' },
  { value: 'fake', label: '🚫 Fake Item' },
  { value: 'inappropriate', label: '⚠️ Inappropriate Content' },
  { value: 'scam', label: '💰 Suspected Scam' },
  { value: 'other', label: '❓ Other' },
];

export default function ReportModal({ listingId, requestId, serviceId, conversationId, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setError('Please login to report');
        setLoading(false);
        return;
      }

      // ⭐ CHECK RATE LIMIT
      const rateLimit = await checkRateLimit(authData.user.id, 'CREATE_REPORT');
      if (!rateLimit.allowed) {
        setError(rateLimit.message);
        setLoading(false);
        return;
      }

      // ⭐ SANITIZE INPUT
      const sanitizedDescription = description ? DOMPurify.sanitize(description) : null;

      const { error: insertError } = await supabase.from('reports').insert([
        {
          listing_id: listingId || null,
          request_id: requestId || null,
          service_id: serviceId || null,
          conversation_id: conversationId || null,
          reporter_id: authData.user.id,
          reason,
          description: sanitizedDescription,
          status: 'pending',
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // ⭐ RECORD ACTION
      await recordAction(authData.user.id, 'CREATE_REPORT', {
        reason,
        listing_id: listingId || null,
        request_id: requestId || null,
        service_id: serviceId || null,
        conversation_id: conversationId || null,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = conversationId
    ? 'Report Conversation'
    : requestId
    ? 'Report Material Request'
    : serviceId
    ? 'Report Service'
    : 'Report Listing';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4 font-body">
      <div className="bg-[#FBF8F1] rounded-2xl border border-[#EDE6D6] shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#1B2A4A]">
            <AlertCircle className="w-5 h-5 text-red-600" />
            {modalTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F3EEDC] text-[#5B5647] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-[#27AE60] mx-auto mb-3" />
            <p className="font-display font-bold text-base mb-1 text-[#1B2A4A]">
              Report Submitted
            </p>
            <p className="text-sm text-[#8A8272]">
              Thank you. Our team will review this shortly.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-2.5">
                What's the issue?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                      reason === opt.value
                        ? 'border-[#1B2A4A] bg-[#FAF6EE] shadow-xs'
                        : 'border-[#EDE6D6] bg-white hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={opt.value}
                      checked={reason === opt.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 accent-[#1B2A4A]"
                    />
                    <span className="text-sm text-[#1B2A4A] font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
                More details (Optional)
              </label>
              <textarea
                placeholder="Explain why you're reporting this..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                maxLength={300}
                className="w-full px-3 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                rows="3"
              />
              <p className="text-xs text-[#8A8272] mt-1 text-right">{description.length}/300</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#5B5647] font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] transition shadow-xs active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Reporting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
