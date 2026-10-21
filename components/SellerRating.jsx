import { Star } from 'lucide-react';

export default function SellerRating({ rating, totalReviews }) {
  if (rating === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
      <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-900 leading-tight">
          {rating.toFixed(1)}
        </p>
        <p className="text-xs text-amber-800/80">({totalReviews} reviews)</p>
      </div>
    </div>
  );
}
