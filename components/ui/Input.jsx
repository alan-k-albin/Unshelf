'use client';

import React from 'react';

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold mb-2 font-body text-[#1B2A4A]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8272] pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={id}
          className={`w-full ${
            Icon ? 'pl-12' : 'px-4'
          } pr-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm font-body text-[#1B2A4A] bg-white placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1 font-body">{error}</p>}
    </div>
  );
}
