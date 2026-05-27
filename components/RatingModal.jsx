'use client';

import { useState } from 'react';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';

export default function RatingModal({ sellerId, listingId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setError('Please login to leave a review');
        setLoading(false);
        return;
      }

      // ⭐ CHECK RATE LIMIT
      const rateLimit = await checkRateLimit(authData.user.id, 'CREATE_REVIEW');
      if (!rateLimit.allowed) {
        setError(rateLimit.message);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('reviews').insert([
        {
          reviewer_id: authData.user.id,
          seller_id: sellerId,
          listing_id: listingId,
          rating,
          comment: comment || null,
        },
      ]);

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          setError('You have already reviewed this seller');
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      // ⭐ RECORD ACTION
      await recordAction(authData.user.id, 'CREATE_REVIEW', { seller_id: sellerId });

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from('users')
          .update({
            rating: parseFloat(avgRating.toFixed(2)),
            total_reviews: reviews.length,
          })
          .eq('id', sellerId);
      }

      onSuccess();
      onClose();
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
          <h3 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
            Rate this Seller
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#1B2A4A' }}>
            How would you rate?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-3xl transition-transform hover:scale-110"
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            Add a comment (Optional)
          </label>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            maxLength={200}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/200</p>
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
            disabled={loading || rating === 0}
            className="flex-1 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
                                                         }
