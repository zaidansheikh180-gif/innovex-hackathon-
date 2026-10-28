/**
 * @file storage.ts
 * Centralized data storage layer for the browser-only Village Water Supply app.
 * All persistence uses localStorage. No backend or network requests are used.
 * Strictly respects the policy: NO INDIVIDUAL RECORD DELETION.
 */

import {
  AppDatabase,
  ScheduleEntry,
  Notice,
  SupplyRecord,
  Report,
  WaterTestResult,
  ComplaintStatus,
  UserRole,
} from './types.ts';
import { INITIAL_SAMPLE_DATABASE } from './sampleData.ts';
import { validateImportDatabase } from '../lib/validation.ts';

const STORAGE_KEY_DB = 'village_water_app_db_v1';
const STORAGE_KEY_ROLE = 'village_water_app_role_v1';
const STORAGE_KEY_MY_REPORTS = 'village_water_app_my_reports_v1';

export interface StorageError {
  type: 'CORRUPTED' | 'UNKNOWN_VERSION' | 'BLOCKED_OR_FULL' | 'VALIDATION_FAILED';
  message: string;
}

export type StorageListener = () => void;
const listeners = new Set<StorageListener>();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Loads the current database from localStorage.
 * If not present, initializes with sample data.
 */
export function loadDatabase(): { db: AppDatabase | null; error?: StorageError } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB);
    if (!raw) {
      // First run: initialize with sample data
      const initial = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATABASE));
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(initial));
      return { db: initial };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        db: null,
        error: {
          type: 'CORRUPTED',
          message: 'The local database storage is corrupted and could not be read.',
        },
      };
    }

    if (!parsed || typeof parsed !== 'object' || (parsed as any).schemaVersion !== 1) {
      return {
        db: null,
        error: {
          type: 'UNKNOWN_VERSION',
          message: `Unknown or missing schemaVersion in stored data. Expected schemaVersion 1.`,
        },
      };
    }

    return { db: parsed as AppDatabase };
  } catch (err: any) {
    return {
      db: null,
      error: {
        type: 'BLOCKED_OR_FULL',
        message: err?.message || 'Access to local browser storage was blocked or failed.',
      },
    };
  }
}

/**
 * Commits database to localStorage.
 */
export function saveDatabase(db: AppDatabase): { success: boolean; error?: StorageError } {
  try {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(db));
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: {
        type: 'BLOCKED_OR_FULL',
        message:
          'Browser storage is full or storage access was restricted. Your recent changes could not be saved to disk.',
      },
    };
  }
}

/**
 * Confirmed Full Reset to Sample Data.
 * Note: Individual deletions are forbidden; bulk replacement occurs only here or via JSON import.
 */
export function resetToSampleData(): { success: boolean; error?: StorageError } {
  try {
    const sampleCopy = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATABASE));
    const result = saveDatabase(sampleCopy);
    if (result.success) {
      // Also clear my reports tracked list to match empty S-04 state on fresh reset
      localStorage.removeItem(STORAGE_KEY_MY_REPORTS);
      notifyListeners();
      return { success: true };
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: {
        type: 'BLOCKED_OR_FULL',
        message: err?.message || 'Failed to reset storage.',
      },
    };
  }
}

/**
 * Exports current database as a formatted JSON string.
 */
export function exportDatabaseAsJSON(): string {
  const { db } = loadDatabase();
  return JSON.stringify(db || INITIAL_SAMPLE_DATABASE, null, 2);
}

/**
 * Validates and imports a JSON string to overwrite current database.
 * If validation fails or saving fails, current database is preserved completely unchanged.
 */
export function importDatabaseFromJSON(jsonString: string): { success: boolean; error?: string } {
  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'File is not valid JSON.' };
  }

  const validation = validateImportDatabase(rawParsed);
  if (!validation.isValid || !validation.data) {
    return { success: false, error: validation.error || 'Validation failed for imported data.' };
  }

  // Attempt save
  const saveRes = saveDatabase(validation.data);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error?.message || 'Storage error occurred while writing import.' };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// OPERATOR & RESIDENT ACTIONS (NO INDIVIDUAL DELETIONS)
// ---------------------------------------------------------------------------

/**
 * S-07: Add a new schedule entry.
 */
export function addScheduleEntry(
  entry: Omit<ScheduleEntry, 'id' | 'isSample'>
): { success: boolean; entry?: ScheduleEntry; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const newEntry: ScheduleEntry = {
    ...entry,
    id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isSample: false,
  };

  db.scheduleEntries.push(newEntry);
  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true, entry: newEntry };
}

/**
 * S-07: Edit an existing schedule entry in-place.
 * Strictly editing: does not delete or change record ID.
 */
export function updateScheduleEntry(
  id: string,
  updates: Omit<ScheduleEntry, 'id' | 'isSample'>
): { success: boolean; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const index = db.scheduleEntries.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Schedule entry not found.' };
  }

  db.scheduleEntries[index] = {
    ...db.scheduleEntries[index],
    ...updates,
    isSample: false, // User modified
  };

  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true };
}

/**
 * S-07: Post a delay or service notice.
 */
export function addNotice(
  notice: Omit<Notice, 'id' | 'createdAt' | 'isSample'>
): { success: boolean; notice?: Notice; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const newNotice: Notice = {
    ...notice,
    id: `notice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isSample: false,
  };

  // Prepend so latest notice is visible first
  db.notices.unshift(newNotice);
  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true, notice: newNotice };
}

/**
 * S-05: Record a supply distribution.
 */
export function addSupplyRecord(
  record: Omit<SupplyRecord, 'id' | 'createdAt' | 'isSample'>
): { success: boolean; record?: SupplyRecord; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const newSupply: SupplyRecord = {
    ...record,
    id: `supply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isSample: false,
  };

  // Prepend so latest supply is at top of area's history
  db.supplyRecords.unshift(newSupply);
  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true, record: newSupply };
}

/**
 * S-03: Resident submits a report.
 * Automatically marks initial status as "New".
 */
export function addReport(
  report: Omit<Report, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'isSample'>
): { success: boolean; report?: Report; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const nowIso = new Date().toISOString();
  const newReport: Report = {
    ...report,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'New',
    createdAt: nowIso,
    updatedAt: nowIso,
    isSample: false,
  };

  db.reports.unshift(newReport);
  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };

  // Track in my reports on this device
  addMyReportId(newReport.id);

  return { success: true, report: newReport };
}

/**
 * S-06: Operator updates complaint status.
 * Bidirectional: 'New' <-> 'In progress' <-> 'Resolved' (Proposed).
 */
export function updateReportStatus(
  id: string,
  status: ComplaintStatus
): { success: boolean; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const index = db.reports.findIndex((r) => r.id === id);
  if (index === -1) {
    return { success: false, error: 'Report not found.' };
  }

  db.reports[index] = {
    ...db.reports[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true };
}

/**
 * S-09: Add external water test result.
 */
export function addWaterTestResult(
  result: Omit<WaterTestResult, 'id' | 'enteredAt' | 'isSample'>
): { success: boolean; test?: WaterTestResult; error?: string } {
  const { db, error } = loadDatabase();
  if (!db || error) return { success: false, error: error?.message || 'Unable to load storage.' };

  const newTest: WaterTestResult = {
    ...result,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    enteredAt: new Date().toISOString(),
    isSample: false,
  };

  db.waterTestResults.unshift(newTest);
  const saveRes = saveDatabase(db);
  if (!saveRes.success) return { success: false, error: saveRes.error?.message };
  return { success: true, test: newTest };
}

// ---------------------------------------------------------------------------
// ROLE MANAGEMENT (DEMO CONVENIENCE, SURVIVES RELOAD)
// ---------------------------------------------------------------------------

export function getStoredRole(): UserRole {
  try {
    const role = localStorage.getItem(STORAGE_KEY_ROLE);
    if (role === 'operator' || role === 'resident') {
      return role;
    }
  } catch {
    // ignore
  }
  return 'resident'; // Proposed default
}

export function setStoredRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_KEY_ROLE, role);
    notifyListeners();
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// DEVICE-LOCAL "MY REPORTS" TRACKER (S-04)
// ---------------------------------------------------------------------------

export function getMyReportIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MY_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function addMyReportId(id: string): void {
  try {
    const ids = getMyReportIds();
    if (!ids.includes(id)) {
      ids.unshift(id);
      localStorage.setItem(STORAGE_KEY_MY_REPORTS, JSON.stringify(ids));
      notifyListeners();
    }
  } catch {
    // ignore
  }
}
