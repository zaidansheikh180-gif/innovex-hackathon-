/**
 * @file App.tsx
 * Main application shell, client-side routing, role synchronization,
 * and global storage error recovery.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppDatabase } from './data/types.ts';
import {
  loadDatabase,
  getStoredRole,
  setStoredRole,
  subscribeToStorage,
  resetAllData,
  StorageError,
} from './data/storage.ts';
import { HeaderAndNav } from './components/HeaderAndNav.tsx';
import { RoleMismatchNotice } from './components/RoleMismatchNotice.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { HomeScreen } from './pages/HomeScreen.tsx';
import { ResidentScheduleScreen } from './pages/ResidentScheduleScreen.tsx';
import { ResidentReportScreen } from './pages/ResidentReportScreen.tsx';
import { ResidentMyReportsScreen } from './pages/ResidentMyReportsScreen.tsx';
import { OperatorSupplyScreen } from './pages/OperatorSupplyScreen.tsx';
import { OperatorComplaintsScreen } from './pages/OperatorComplaintsScreen.tsx';
import { OperatorScheduleScreen } from './pages/OperatorScheduleScreen.tsx';
import { OperatorCompareScreen } from './pages/OperatorCompareScreen.tsx';
import { WaterTestsScreen } from './pages/WaterTestsScreen.tsx';
import { DataManagementScreen } from './pages/DataManagementScreen.tsx';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { GlassButton } from './components/GlassButton.tsx';

function normalizePath(hashOrPath: string): string {
  // If hash routing is used (e.g., #/schedule), extract after #
  if (hashOrPath.includes('#')) {
    const afterHash = hashOrPath.split('#')[1] || '/';
    return afterHash.startsWith('/') ? afterHash : `/${afterHash}`;
  }
  return hashOrPath.startsWith('/') ? hashOrPath : `/${hashOrPath}`;
}

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => getStoredRole());
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.hash || window.location.pathname || '/');
  });

  const [dbState, setDbState] = useState<{ db: AppDatabase | null; error?: StorageError }>(
    () => loadDatabase()
  );

  const [isResetRecoveryModalOpen, setIsResetRecoveryModalOpen] = useState(false);

  // Sync state with storage updates
  const reloadFromStorage = useCallback(() => {
    const loaded = loadDatabase();
    setDbState(loaded);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToStorage(reloadFromStorage);
    return () => unsubscribe();
  }, [reloadFromStorage]);

  // Sync path changes (popstate / hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = normalizePath(window.location.hash || window.location.pathname || '/');
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    const normalized = normalizePath(path);
    window.location.hash = normalized;
    setCurrentPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setStoredRole(newRole);
  };

  const handleRecoveryReset = () => {
    resetAllData();
    setIsResetRecoveryModalOpen(false);
    reloadFromStorage();
  };

  // Check if current path belongs exclusively to a specific role
  const isOperatorRoute = currentPath.startsWith('/operator');
  const isResidentOnlyRoute = currentPath === '/report' || currentPath === '/my-reports';

  // Render active screen
  const renderContent = () => {
    // If storage corrupted or unknown version
    if (!dbState.db || dbState.error) {
      return (
        <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-300 rounded-lg text-rose-950 space-y-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-rose-900">
                Storage Error ({dbState.error?.type || 'CORRUPTED'})
              </h2>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                {dbState.error?.message ||
                  'The browser could not load local records. Your storage might be blocked, full, or formatted with an unknown schema version.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <GlassButton
              type="button"
              onClick={reloadFromStorage}
              tone="rose" className="px-4 py-2 font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Reading Storage</span>
            </GlassButton>
            <GlassButton
              type="button"
              onClick={() => setIsResetRecoveryModalOpen(true)}
              tone="roseSoft" className="px-4 py-2 font-medium text-xs"
            >
              Reset to Empty Data
            </GlassButton>
          </div>
        </div>
      );
    }

    const db = dbState.db;

    // Role mismatch check for operator-only screens
    if (isOperatorRoute && currentRole !== 'operator') {
      return (
        <RoleMismatchNotice
          requiredRole="operator"
          currentRole={currentRole}
          onSwitchRole={handleRoleSwitch}
          onGoHome={() => navigateTo('/')}
        />
      );
    }

    // Role mismatch check for resident-only screens
    if (isResidentOnlyRoute && currentRole !== 'resident') {
      return (
        <RoleMismatchNotice
          requiredRole="resident"
          currentRole={currentRole}
          onSwitchRole={handleRoleSwitch}
          onGoHome={() => navigateTo('/')}
        />
      );
    }

    switch (currentPath) {
      case '/':
        return (
          <HomeScreen
            currentRole={currentRole}
            onSelectRole={handleRoleSwitch}
            onNavigate={navigateTo}
          />
        );
      case '/schedule':
        return <ResidentScheduleScreen db={db} onNavigate={navigateTo} />;
      case '/report':
        return <ResidentReportScreen areas={db.areas} onNavigate={navigateTo} />;
      case '/my-reports':
        return <ResidentMyReportsScreen db={db} onNavigate={navigateTo} />;
      case '/operator/supply':
        return <OperatorSupplyScreen db={db} />;
      case '/operator/complaints':
        return <OperatorComplaintsScreen db={db} />;
      case '/operator/schedule':
        return <OperatorScheduleScreen db={db} />;
      case '/operator/compare':
        return <OperatorCompareScreen db={db} />;
      case '/water-tests':
        return <WaterTestsScreen db={db} currentRole={currentRole} />;
      case '/data':
        return <DataManagementScreen db={db} />;
      default:
        // Unknown route goes to S-01
        return (
          <HomeScreen
            currentRole={currentRole}
            onSelectRole={handleRoleSwitch}
            onNavigate={navigateTo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col text-slate-900 antialiased selection:bg-teal-200 selection:text-teal-950">
      {/* Shared Page Background with responsive crop and minimum overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src="/assets/village-background.jpeg"
          alt=""
          className="w-full h-full object-cover object-bottom md:object-[center_70%] select-none"
        />
        {/* Minimum overlay so the illustration is clearly visible while keeping text contrast high */}
        <div className="absolute inset-0 bg-slate-900/5" />
      </div>

      {/* Shell Header & Nav */}
      <HeaderAndNav
        currentPath={currentPath}
        currentRole={currentRole}
        onNavigate={navigateTo}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Main Screen Container with padding bottom for phone nav */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20 md:pb-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white text-slate-600 text-xs py-4 px-4 text-center hidden md:block">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>JalSetu (Browser-Only Demo)</span>
          <span className="text-[11px]">
            Data stored locally on this device • Zero backend dependencies
          </span>
        </div>
      </footer>

      {/* Recovery Modal */}
      <ConfirmModal
        isOpen={isResetRecoveryModalOpen}
        title="Reset Storage to Empty Data?"
        message="This will overwrite corrupted local storage data and start again with no schedules, notices, reports, supply or water-test records."
        confirmLabel="Reset Storage Now"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleRecoveryReset}
        onCancel={() => setIsResetRecoveryModalOpen(false)}
      />
    </div>
  );
}
