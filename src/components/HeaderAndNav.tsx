/**
 * @file HeaderAndNav.tsx
 * Responsive shell navigation:
 * - Desktop/tablet: Top header and primary navigation bar.
 * - Mobile: Fixed bottom navigation bar with large touch targets.
 * - Adapts navigation items dynamically based on current demo role.
 * - Prominent "Switch role" link and device boundary indicators on every view.
 */

import React from 'react';
import { UserRole } from '../data/types.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import {
  Calendar,
  AlertTriangle,
  ClipboardList,
  Droplets,
  Sliders,
  BarChart2,
  FlaskConical,
  Database,
  ArrowLeftRight,
  Home,
} from 'lucide-react';
import { GlassButton } from './GlassButton.tsx';

interface HeaderAndNavProps {
  currentPath: string;
  currentRole: UserRole;
  onNavigate: (path: string) => void;
  onRoleSwitch: (role: UserRole) => void;
}

export const HeaderAndNav: React.FC<HeaderAndNavProps> = ({
  currentPath,
  currentRole,
  onNavigate,
  onRoleSwitch,
}) => {
  const residentNavItems = [
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/report', label: 'Report Issue', icon: AlertTriangle },
    { path: '/my-reports', label: 'My Reports', icon: ClipboardList },
    { path: '/water-tests', label: 'Water Tests', icon: FlaskConical },
    { path: '/data', label: 'Data', icon: Database },
  ];

  const operatorNavItems = [
    { path: '/operator/supply', label: 'Supply Log', icon: Droplets },
    { path: '/operator/complaints', label: 'Complaints', icon: ClipboardList },
    { path: '/operator/schedule', label: 'Manage Timings', icon: Sliders },
    { path: '/operator/compare', label: 'Compare', icon: BarChart2 },
    { path: '/water-tests', label: 'Water Tests', icon: FlaskConical },
    { path: '/data', label: 'Data', icon: Database },
  ];

  const navItems = currentRole === 'resident' ? residentNavItems : operatorNavItems;

  const toggleRole = () => {
    onRoleSwitch(currentRole === 'resident' ? 'operator' : 'resident');
  };

  return (
    <>
      {/* Top Banner: Device Boundary Honesty Statement */}
      <div className="bg-slate-800 text-slate-200 text-xs px-4 py-1.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>
            <strong>Local Storage Only:</strong> Data stays exclusively on this browser/device.
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Demo role switch is for preview only (not login or security).
        </div>
      </div>

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand & Home */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-left focus:outline-hidden focus:ring-2 focus:ring-teal-700 rounded p-1"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
              H2O
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {PLACEHOLDERS.appName}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {PLACEHOLDERS.appTagline}
              </p>
            </div>
          </button>

          {/* Role Indicator & Demo Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                Demo Role
              </span>
              <span className="text-xs font-bold text-slate-900 capitalize">
                {currentRole === 'resident' ? 'Resident View' : 'Operator / Panchayat'}
              </span>
            </div>

            <GlassButton
              type="button"
              onClick={toggleRole}
              tone="neutral" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              aria-label={`Switch demo role from ${currentRole} to ${
                currentRole === 'resident' ? 'operator' : 'resident'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>
                Switch to {currentRole === 'resident' ? 'Operator' : 'Resident'}
              </span>
            </GlassButton>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Desktop primary navigation"
          className="hidden md:block bg-slate-50 border-t border-slate-200"
        >
          <div className="max-w-6xl mx-auto px-4 flex items-center space-x-1">
            <GlassButton
              type="button"
              onClick={() => onNavigate('/')}
              tone={currentPath === '/' ? 'tealSoft' : 'neutral'} className={`px-3 py-2 text-xs sm:text-sm flex items-center gap-1.5 ${currentPath === '/' ? 'font-bold' : 'font-medium'}`} aria-current={currentPath === '/' ? 'page' : undefined}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </GlassButton>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <GlassButton
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  tone={isActive ? 'tealSoft' : 'neutral'} className={`px-3 py-2 text-xs sm:text-sm flex items-center gap-1.5 ${isActive ? 'font-bold' : 'font-medium'}`} aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </GlassButton>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Phone Bottom Navigation Bar (Fixed, high contrast, large touch targets) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-300 shadow-lg px-2 py-1 safe-area-bottom"
      >
        <div className="grid grid-cols-5 items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <GlassButton
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                tone={isActive ? 'tealSoft' : 'neutral'} className={`flex-col py-1.5 px-1 min-h-[48px] text-[11px] ${isActive ? 'font-bold' : ''}`} wrapperClassName="flex w-full" strokeWidth={1}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-800' : 'text-slate-500'}`} />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </GlassButton>
            );
          })}
        </div>
      </nav>
    </>
  );
};
