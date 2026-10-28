/**
 * @file DataManagementScreen.tsx
 * Screen S-10: /data
 * Export JSON, Import JSON (full replacement with strict pre-validation & overwrite warning),
 * and Confirmed Full Reset to Sample Data.
 * Strict policy: No individual record deletion. Focus returns to trigger upon modal dismiss.
 */

import React, { useState, useRef } from 'react';
import { AppDatabase } from '../data/types.ts';
import {
  exportDatabaseAsJSON,
  importDatabaseFromJSON,
  resetToSampleData,
  getBackupInfo,
  restorePreviousData,
} from '../data/storage.ts';
import { IMPORT_LIMITS } from '../lib/validation.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { getTodayDateString } from '../lib/dateUtils.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface DataManagementScreenProps {
  db: AppDatabase;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({ db }) => {
  // Modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');

  // Status banners
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupTick, setBackupTick] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const backupInfo = React.useMemo(() => getBackupInfo(), [backupTick, db]);
  const restoreTriggerRef = useRef<HTMLButtonElement>(null);

  const handleConfirmRestore = () => {
    setIsProcessing(true);
    const result = restorePreviousData();
    setIsProcessing(false);
    setIsRestoreModalOpen(false);
    setBackupTick((t) => t + 1);
    setStatusMessage(
      result.success
        ? { type: 'success', text: 'Previous data restored. The data it replaced is now the recovery copy.' }
        : { type: 'error', text: `Restore failed: ${result.error}` }
    );
  };

  // Trigger refs for returning focus
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // EXPORT JSON
  // -------------------------------------------------------------
  const handleExport = () => {
    try {
      const jsonStr = exportDatabaseAsJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `village_water_data_${getTodayDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'Database exported successfully as JSON file.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to export JSON database.',
      });
    }
  };

  // -------------------------------------------------------------
  // IMPORT JSON (Staged & Confirmed)
  // -------------------------------------------------------------
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      setStatusMessage({
        type: 'error',
        text: 'Import failed: file is larger than 2 MB. Existing data remains unchanged.',
      });
      e.target.value = '';
      return;
    }

    setPendingFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setStatusMessage({
          type: 'error',
          text: 'Selected file is empty or could not be read.',
        });
        return;
      }
      setPendingImportJson(content);
      setIsImportModalOpen(true);
    };
    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Failed to read the selected file.',
      });
    };
    reader.readAsText(file);

    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingImportJson) return;
    setIsProcessing(true);

    try {
      const result = importDatabaseFromJSON(pendingImportJson);
      setIsProcessing(false);
      setIsImportModalOpen(false);
      setPendingImportJson(null);

      if (!result.success) {
        setStatusMessage({
          type: 'error',
          text: `Import failed: ${result.error}. Existing data remains unchanged.`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Database successfully imported and replaced from backup file.',
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setIsImportModalOpen(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unexpected error during import.',
      });
    }
  };

  // -------------------------------------------------------------
  // RESET TO SAMPLE DATA (Confirmed)
  // -------------------------------------------------------------
  const handleConfirmReset = () => {
    setIsProcessing(true);
    try {
      const result = resetToSampleData();
      setIsProcessing(false);
      setIsResetModalOpen(false);

      if (!result.success) {
        setStatusMessage({
          type: 'error',
          text: result.error?.message || 'Failed to reset database.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'All records have been reset to initial sample data.',
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setIsResetModalOpen(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error occurred while resetting.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-700" />
          <span>Data Storage & Backup Settings</span>
        </h1>
        <p className="text-sm text-slate-600">
          Export your records to move data between devices, restore from a verified JSON backup, or reset to initial sample data.
        </p>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          role="status"
          className={`p-4 rounded-lg border flex items-start gap-2.5 text-xs sm:text-sm font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Storage Information & Honesty Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <FileCode className="w-4 h-4 text-slate-500" />
          <span>Local Storage Metrics & Schema Integrity</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-lg font-bold text-slate-900">{db.schemaVersion}</div>
            <div className="text-[11px] text-slate-500">Schema Version</div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-lg font-bold text-slate-900">{db.scheduleEntries.length}</div>
            <div className="text-[11px] text-slate-500">Schedule Slots</div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-lg font-bold text-slate-900">{db.supplyRecords.length}</div>
            <div className="text-[11px] text-slate-500">Supply Logs</div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-lg font-bold text-slate-900">{db.reports.length}</div>
            <div className="text-[11px] text-slate-500">Complaints</div>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1 pt-1">
          <p>
            <strong>Storage Limit:</strong> {PLACEHOLDERS.disclaimers.deviceOnly}
          </p>
          <p>
            <strong>Bulk Replacement Policy:</strong> Individual records cannot be deleted.
            Bulk state changes occur exclusively through confirmed JSON Import or confirmed Sample Reset.
          </p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Export JSON */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Export Backup (JSON)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download all village schedules, supply logs, notices, and reports into a standalone JSON file.
            </p>
          </div>

          <GlassButton
            type="button"
            onClick={handleExport}
            tone="teal" className="py-2.5 px-3 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5" wrapperClassName="flex w-full"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </GlassButton>
        </div>

        {/* 2. Import JSON */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Restore / Import (JSON)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Import a valid JSON backup from another device. Requires confirmation as it replaces all current records.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelected}
              className="sr-only"
              id="json-file-input"
            />
            <GlassButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              tone="blue" className="py-2.5 px-3 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5" wrapperClassName="flex w-full"
            >
              <Upload className="w-4 h-4" />
              <span>Select File to Import...</span>
            </GlassButton>
          </div>
        </div>

        {/* 3. Reset to Sample Data */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Reset to Sample Data</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restore default sample schedules, notices, complaints, and test records. Replaces all user-added entries.
            </p>
          </div>

          <GlassButton
            ref={resetTriggerRef}
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            tone="roseSoft" className="py-2.5 px-3 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5" wrapperClassName="flex w-full"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Sample Data</span>
          </GlassButton>
        </div>
      </div>

      {/* Recovery copy (kept in this browser only) */}
      {backupInfo && backupInfo.restorable && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Restore Previous Data</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A copy of your data from before the last {backupInfo.reason === 'import' ? 'import' : backupInfo.reason === 'reset' ? 'reset' : 'restore'} is
              kept on this browser (saved {new Date(backupInfo.savedAt).toLocaleString()}). Only one copy is kept.
            </p>
          </div>
          <GlassButton
            ref={restoreTriggerRef}
            type="button"
            onClick={() => setIsRestoreModalOpen(true)}
            tone="blue" className="py-2.5 px-4 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5" wrapperClassName="flex shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restore Previous Data</span>
          </GlassButton>
        </div>
      )}

      {/* Confirmation Modal: IMPORT OVERWRITE */}
      <ConfirmModal
        isOpen={isImportModalOpen}
        title="Overwrite All Current Data With Import?"
        message={
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-950 text-xs">
              <strong className="block mb-1">Warning: Bulk Replacement Action</strong>
              Importing <code>{pendingFileName}</code> will permanently overwrite and replace all current
              schedules, supply logs, complaints, and notices stored on this browser.
            </div>
            <p className="text-xs text-slate-600">
              The file will be strictly verified before writing. If any schema error or corrupted field is
              detected, your existing data remains completely untouched.
            </p>
          </div>
        }
        confirmLabel="Yes, Overwrite & Import"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isProcessing}
        triggerElementRef={fileInputRef}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setIsImportModalOpen(false);
          setPendingImportJson(null);
        }}
      />

      {/* Confirmation Modal: RESET TO SAMPLE DATA */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset All Data to Sample Records?"
        message={
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              Are you sure you want to restore the initial sample dataset?
            </p>
            <p className="p-2.5 bg-slate-100 rounded text-slate-800">
              This will replace all user-entered reports, supply distributions, edited timings, and notices on
              this device with the default sample data.
            </p>
          </div>
        }
        confirmLabel="Yes, Reset to Sample Data"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isProcessing}
        triggerElementRef={resetTriggerRef}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
      <ConfirmModal
        isOpen={isRestoreModalOpen}
        title="Restore Previous Data?"
        message={
          <p className="text-xs text-slate-700">
            This replaces what is on this device now with the saved previous copy. The current data becomes the
            recovery copy, so you can switch back.
          </p>
        }
        confirmLabel="Yes, Restore Previous Data"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isProcessing}
        triggerElementRef={restoreTriggerRef}
        onConfirm={handleConfirmRestore}
        onCancel={() => setIsRestoreModalOpen(false)}
      />
    </div>
  );
};
