/**
 * @file RoleMismatchNotice.tsx
 * Displayed when user visits a route designed for the other role.
 * Includes a direct link/action to switch role.
 */

import React from 'react';
import { UserRole } from '../data/types.ts';
import { ArrowLeftRight, Info } from 'lucide-react';

interface RoleMismatchNoticeProps {
  requiredRole: UserRole;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onGoHome: () => void;
}

export const RoleMismatchNotice: React.FC<RoleMismatchNoticeProps> = ({
  requiredRole,
  currentRole,
  onSwitchRole,
  onGoHome,
}) => {
  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-4">
      <div className="flex items-start gap-3">
        <Info className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-bold text-amber-900">
            {requiredRole === 'operator' ? 'Operator View' : 'Resident View'}
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            You are currently browsing in{' '}
            <strong className="capitalize">{currentRole} demo mode</strong>. This section is intended
            for {requiredRole === 'operator' ? 'water operators / panchayat members' : 'village residents'}.
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onSwitchRole(requiredRole)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-amber-800 hover:bg-amber-900 text-white font-medium text-sm transition focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Switch demo role to {requiredRole === 'operator' ? 'Operator' : 'Resident'}</span>
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="px-4 py-2.5 rounded-md bg-white border border-amber-300 text-amber-950 font-medium text-sm hover:bg-amber-100 transition focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        >
          Back to Home
        </button>
      </div>

      <p className="text-xs text-amber-700 border-t border-amber-200/80 pt-2">
        Note: The role switch is a demo convenience to view both sides of the application; it does
        not represent a secure login system.
      </p>
    </div>
  );
};
