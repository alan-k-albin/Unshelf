export default function SellerRating({ rating, totalReviews }) {
  if (rating === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FEF3C7' }}>
      <span className="text-lg">⭐</span>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
          {rating.toFixed(1)}
        </p>
        <p className="text-xs text-gray-600">({totalReviews} reviews)</p>
      </div>
    </div>
  );
}
