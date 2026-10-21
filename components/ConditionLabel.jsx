'use client';

import { Sparkles, ThumbsUp, BookOpen, Wrench } from 'lucide-react';

export default function ConditionLabel({ condition }) {
  const conditionConfig = {
    'Like New': {
      icon: Sparkles,
      bg: '#EAF3EC',
      text: '#1F7A44',
      border: '#CFECDA',
      label: 'Like New',
    },
    Good: {
      icon: ThumbsUp,
      bg: '#EAF1FB',
      text: '#2C5AA0',
      border: '#D0E1F9',
      label: 'Good',
    },
    Used: {
      icon: BookOpen,
      bg: '#FBF0DC',
      text: '#B8860B',
      border: '#F5DEB4',
      label: 'Used',
    },
    'Heavily Used': {
      icon: Wrench,
      bg: '#FDECEA',
      text: '#B23A2E',
      border: '#F8D1CC',
      label: 'Heavily Used',
    },
  };

  const config = conditionConfig[condition] || conditionConfig['Good'];
  const IconComponent = config.icon;

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border font-body"
    >
      <IconComponent className="w-3 h-3" strokeWidth={2} />
      {config.label}
    </span>
  );
}
