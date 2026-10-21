'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  action,
  className = '',
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={`sticky top-0 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#EDE6D6] z-30 px-4 py-3.5 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#1B2A4A] bg-white border border-[#EDE6D6] hover:bg-[#F3EFE4] hover:border-[#1B2A4A] transition flex-shrink-0 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-lg md:text-xl font-semibold text-[#1B2A4A] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="font-body text-xs text-[#5B5647] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
