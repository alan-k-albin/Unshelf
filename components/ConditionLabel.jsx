'use client';

export default function ConditionLabel({ condition }) {
  const conditionConfig = {
    'Like New': { icon: '✨', color: 'bg-green-50 text-green-700', label: 'Like New' },
    'Good': { icon: '👍', color: 'bg-blue-50 text-blue-700', label: 'Good' },
    'Used': { icon: '📖', color: 'bg-yellow-50 text-yellow-700', label: 'Used' },
    'Heavily Used': { icon: '⚙️', color: 'bg-orange-50 text-orange-700', label: 'Heavily Used' }
  };

  const config = conditionConfig[condition] || conditionConfig['Good'];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
    }
