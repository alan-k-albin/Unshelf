'use client';

import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-body transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px]';

  const variants = {
    // Primary green keeps semibold labels at 16px or larger
    primary:
      'text-base font-semibold text-white shadow-md hover:shadow-lg rounded-xl',
    secondary:
      'text-sm font-semibold text-[#1B2A4A] bg-white border-2 border-[#EDE6D6] hover:border-[#1B2A4A] rounded-xl shadow-xs',
    outline:
      'text-sm font-medium text-[#1B2A4A] border-2 border-[#EDE6D6] hover:bg-[#F3EFE4]/50 rounded-xl',
    danger:
      'text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] rounded-xl',
    ghost:
      'text-sm font-medium text-[#5B5647] hover:text-[#1B2A4A] hover:bg-[#F3EFE4]/40 rounded-xl',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs min-h-[38px]',
    md: 'px-5 py-2.5',
    lg: 'px-6 py-3.5',
    full: 'w-full py-3 px-4',
  };

  const style =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg, #27AE60, #1F9550)' }
      : {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
