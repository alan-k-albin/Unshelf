import { Star } from 'lucide-react';

export default function ReviewCard({ review, reviewer }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#EDE6D6] shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-display font-semibold text-sm text-[#1B2A4A]">
            {reviewer?.full_name || 'Anonymous'}
          </p>
          <p className="text-xs text-[#8A8272]">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-amber-500">
          {[...Array(review.rating || 0)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-[#3E3A30] line-clamp-3 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
