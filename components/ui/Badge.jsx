'use client';

import React from 'react';

const CATEGORY_COLORS = {
  Textbooks: { bg: '#FDECEA', text: '#B23A2E', border: '#F8D1CC' },
  'Handwritten Notes': { bg: '#EAF1FB', text: '#2C5AA0', border: '#D0E1F9' },
  'Study Guides': { bg: '#EAF6EE', text: '#227A4B', border: '#CFECDA' },
  Notebooks: { bg: '#FBF0DC', text: '#B8860B', border: '#F5DEB4' },
  'Lab Manuals': { bg: '#F3EAFB', text: '#7B3FA0', border: '#E4D1F7' },
  'Calculators/Tools': { bg: '#EAF6F4', text: '#1D7A6E', border: '#CEEAE6' },
  'Coaching Materials': { bg: '#FCEFF6', text: '#B0396F', border: '#F8D5E7' },
  Other: { bg: '#F1EFEA', text: '#5B5647', border: '#DFDAD0' },
};

export default function Badge({
  children,
  category,
  variant = 'default',
  className = '',
  ...props
}) {
  if (category && CATEGORY_COLORS[category]) {
    const c = CATEGORY_COLORS[category];
    return (
      <span
        style={{ background: c.bg, color: c.text, borderColor: c.border }}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${className}`}
        {...props}
      >
        {children || category}
      </span>
    );
  }

  const variants = {
    default: 'bg-[#F3EFE4] text-[#1B2A4A] border-[#EDE6D6]',
    active: 'bg-[#EAF3EC] text-[#1F7A44] border-[#CFECDA]',
    urgent: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    blue: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        variants[variant] || variants.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
