'use client';

import { Search } from 'lucide-react';

export default function EmptyState({ title = "No listings found", description = "Try adjusting your filters or search terms" }) {
  return (
    <div className="bg-white rounded-lg p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-accent/10 rounded-full">
          <Search className="w-8 h-8 text-accent" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
    </div>
  );
}
