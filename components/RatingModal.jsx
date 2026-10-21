'use client';

import { useState } from 'react';
import { X, Loader, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';
import DOMPurify from 'dompurify';

export default function RatingModal({ sellerId, listingId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
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

      // ⭐ SANITIZE INPUT
      const sanitizedComment = comment ? DOMPurify.sanitize(comment) : null;

      const { error: insertError } = await supabase.from('reviews').insert([
        {
          reviewer_id: authData.user.id,
          seller_id: sellerId,
          listing_id: listingId,
          rating,
          comment: sanitizedComment,
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

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4 font-body">
      <div className="bg-[#FBF8F1] rounded-2xl border border-[#EDE6D6] shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-[#1B2A4A]">
            Rate this Seller
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F3EEDC] text-[#5B5647] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#1B2A4A] mb-3">
            How would you rate?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= activeRating
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <p className="text-xs text-[#8A8272] font-medium mt-2">
              {activeRating === 1 && 'Poor'}
              {activeRating === 2 && 'Fair'}
              {activeRating === 3 && 'Good'}
              {activeRating === 4 && 'Very Good'}
              {activeRating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
            Add a comment (Optional)
          </label>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            maxLength={200}
            className="w-full px-3 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] resize-none focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
            rows="3"
          />
          <p className="text-xs text-[#8A8272] mt-1 text-right">{comment.length}/200</p>
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
            disabled={loading || rating === 0}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98]"
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
