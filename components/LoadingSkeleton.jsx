'use client';

export default function LoadingSkeleton() {
  return (
    <div className="listing-card animate-pulse">
      <div className="w-full h-48 bg-gray-300 rounded-lg mb-3"></div>
      <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
    </div>
  );
}
