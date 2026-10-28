/**
 * @file HomeScreen.tsx
 * Screen S-01: Home
 * Role choice, sample-data notice, device-only explanation, and clear boundaries.
 */

import React from 'react';
import { UserRole } from '../data/types.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import { SampleBadge } from '../components/SampleBadge.tsx';
import {
  Users,
  ShieldAlert,
  ArrowRight,
  HardHat,
  Database,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface HomeScreenProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onNavigate: (path: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentRole,
  onSelectRole,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Introduction */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            {PLACEHOLDERS.villageName}
          </span>
          <SampleBadge />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {PLACEHOLDERS.appName}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {PLACEHOLDERS.appTagline}
        </p>
        <p className="text-xs text-slate-500">
          Built for transparent village water distribution records and community complaint tracking.
        </p>
      </div>

      {/* Role Selection (Demo Switch) */}
      <section aria-labelledby="role-selection-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="role-selection-title" className="text-base font-bold text-slate-900">
            Choose Your Demo Role
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Demo convenience (not a secure login)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resident Card */}
          <div
            className={`p-5 rounded-lg border transition-all ${
              currentRole === 'resident'
                ? 'border-teal-700 bg-teal-50/50 shadow-xs ring-1 ring-teal-700'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Resident</h3>
                <span className="text-xs text-slate-500">For community members & households</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Check scheduled water supply hours for your area, read delay notices, and submit reports for
              leaks or service interruptions.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <GlassButton
                type="button"
                onClick={() => {
                  onSelectRole('resident');
                  onNavigate('/schedule');
                }}
                tone={currentRole === 'resident' ? 'teal' : 'neutral'} className="py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5" wrapperClassName="flex w-full"
              >
                <span>Enter as Resident</span>
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>

          {/* Operator / Panchayat Card */}
          <div
            className={`p-5 rounded-lg border transition-all ${
              currentRole === 'operator'
                ? 'border-teal-700 bg-teal-50/50 shadow-xs ring-1 ring-teal-700'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Water Operator / Panchayat</h3>
                <span className="text-xs text-slate-500">For water management & administration</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Log actual distribution timings, track and resolve resident complaints, manage area schedules,
              and post delay notices.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <GlassButton
                type="button"
                onClick={() => {
                  onSelectRole('operator');
                  onNavigate('/operator/supply');
                }}
                tone={currentRole === 'operator' ? 'teal' : 'neutral'} className="py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5" wrapperClassName="flex w-full"
              >
                <span>Enter as Operator</span>
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Based on Selected Role */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Quick Shortcuts ({currentRole === 'resident' ? 'Resident' : 'Operator'})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {currentRole === 'resident' ? (
            <>
              <GlassButton
                type="button"
                onClick={() => onNavigate('/schedule')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <Calendar className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Check Schedule</div>
                  <div className="text-xs text-slate-500">Timings & delay notices</div>
                </div>
              </GlassButton>

              <GlassButton
                type="button"
                onClick={() => onNavigate('/report')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Report an Issue</div>
                  <div className="text-xs text-slate-500">Leak, low supply, or no water</div>
                </div>
              </GlassButton>

              <GlassButton
                type="button"
                onClick={() => onNavigate('/my-reports')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">My Reports</div>
                  <div className="text-xs text-slate-500">Track issues logged on this device</div>
                </div>
              </GlassButton>
            </>
          ) : (
            <>
              <GlassButton
                type="button"
                onClick={() => onNavigate('/operator/supply')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <Calendar className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Log Supply</div>
                  <div className="text-xs text-slate-500">Record area supply duration</div>
                </div>
              </GlassButton>

              <GlassButton
                type="button"
                onClick={() => onNavigate('/operator/complaints')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Manage Complaints</div>
                  <div className="text-xs text-slate-500">Update resolution status</div>
                </div>
              </GlassButton>

              <GlassButton
                type="button"
                onClick={() => onNavigate('/operator/schedule')}
                tone="neutral" className="p-3 text-left flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Schedule & Notices</div>
                  <div className="text-xs text-slate-500">Edit timings & post notices</div>
                </div>
              </GlassButton>
            </>
          )}
        </div>
      </section>

      {/* Honesty & Operational Boundaries Box */}
      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <span>App Purpose & Honest Boundaries</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Device Storage Limit:</strong> {PLACEHOLDERS.disclaimers.deviceOnly}
          </li>
          <li>
            <strong>Role Switch:</strong> {PLACEHOLDERS.disclaimers.demoRoleNotice}
          </li>
          <li>
            <strong>Safety & Pipe Integrity:</strong> {PLACEHOLDERS.disclaimers.safetyNotice}
          </li>
          <li>
            <strong>Data Transfer:</strong> To transfer records to another phone or computer, use the JSON Export and Import tools on the{' '}
            <button
              type="button"
              onClick={() => onNavigate('/data')}
              className="text-teal-800 underline font-semibold hover:text-teal-950"
            >
              Data Settings page
            </button>
            .
          </li>
        </ul>
      </section>
    </div>
  );
};
