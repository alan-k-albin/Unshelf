'use client';

import React from 'react';

export default function Card({
  children,
  className = '',
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-2xl border-2 border-[#EDE6D6] p-4 md:p-6 shadow-[0_2px_0_rgba(27,42,74,0.06)] ${
        hoverable
          ? 'hover:border-[#1B2A4A] hover:-translate-y-1 hover:shadow-xl transition-all duration-300'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
