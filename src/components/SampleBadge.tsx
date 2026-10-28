/**
 * @file SampleBadge.tsx
 * Visual label indicating sample data to strictly uphold honesty rules.
 */

import React from 'react';

interface SampleBadgeProps {
  className?: string;
}

export const SampleBadge: React.FC<SampleBadgeProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
      title="This record is pre-seeded sample data"
    >
      Sample Data
    </span>
  );
};
