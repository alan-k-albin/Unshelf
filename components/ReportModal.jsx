'use client';

import { useState } from 'react';
import { X, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';

const REPORT_REASONS = [
  { value: 'spam', label: '🔗 Spam or Duplicate' },
  { value: 'fake', label: '🚫 Fake Item' },
  { value: 'inappropriate', label: '⚠️ Inappropriate Content' },
  { value: 'scam', label: '💰 Suspected Scam' },
  { value: 'other', label: '❓ Other' },
];

export default function ReportModal({ listingId, onClose }) {
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

      const { error: insertError } = await supabase.from('reports').insert([
        {
          listing_id: listingId,
          reporter_id: authData.user.id,
          reason,
          description: description || null,
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
        listing_id: listingId,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1B2A4A' }}>
            <AlertCircle className="w-5 h-5 text-red-600" />
            Report Listing
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="font-semibold mb-1" style={{ color: '#1B2A4A' }}>
              Report Submitted
            </p>
            <p className="text-sm text-gray-600">
              Thank you. Our team will review this shortly.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3" style={{ color: '#1B2A4A' }}>
                What's the issue?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={opt.value}
                      checked={reason === opt.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
                More details (Optional)
              </label>
              <textarea
                placeholder="Explain why you're reporting this..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                maxLength={300}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/300</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="flex-1 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: loading ? '#94A3B8' : '#DC2626',
                }}
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
