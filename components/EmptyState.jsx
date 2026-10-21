'use client';

import { Search } from 'lucide-react';

export default function EmptyState({
  title,
  description,
  message,
  action,
  children,
  icon: Icon = Search,
}) {
  const displayTitle = title || (message ? 'No results found' : 'No listings found');
  const displayDesc = description || message || 'Try adjusting your filters or search terms';

  return (
    <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-[#E7E0D2]">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-[#F3EFE4] rounded-full flex items-center justify-center text-[#1B2A4A] shadow-xs">
          <Icon className="w-7 h-7" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="font-display font-semibold text-lg text-[#1B2A4A] mb-2">
        {displayTitle}
      </h3>
      <p className="font-body text-[#5B5647] text-sm max-w-md mx-auto mb-5 leading-relaxed">
        {displayDesc}
      </p>
      {action && <div className="mt-2">{action}</div>}
      {children}
    </div>
  );
}
