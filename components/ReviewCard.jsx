export default function ReviewCard({ review, reviewer }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1B2A4A' }}>
            {reviewer?.full_name || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-lg">{'⭐'.repeat(review.rating)}</div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-gray-700 line-clamp-3">{review.comment}</p>
      )}
    </div>
  );
}
