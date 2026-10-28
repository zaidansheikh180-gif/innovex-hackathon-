/**
 * @file StatusBadge.tsx
 * Renders complaint and operational statuses using text indicators
 * to ensure accessibility (never relying on color alone).
 */

import React from 'react';
import { ComplaintStatus } from '../data/types.ts';

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyle = '';
  let indicatorText = '';

  switch (status) {
    case 'New':
      badgeStyle = 'bg-blue-100 text-blue-900 border-blue-300';
      indicatorText = '[New]';
      break;
    case 'In progress':
      badgeStyle = 'bg-amber-100 text-amber-950 border-amber-300';
      indicatorText = '[In Progress]';
      break;
    case 'Resolved':
      badgeStyle = 'bg-emerald-100 text-emerald-950 border-emerald-300';
      indicatorText = '[Resolved]';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${badgeStyle} ${className}`}
      aria-label={`Status: ${status}`}
    >
      <span aria-hidden="true" className="font-mono text-[10px]">
        {indicatorText}
      </span>
      <span>{status}</span>
    </span>
  );
};
