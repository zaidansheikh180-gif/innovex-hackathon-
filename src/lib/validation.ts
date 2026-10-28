/**
 * @file validation.ts
 * Validation helpers for form inputs, text length limits, and import files.
 */

import { AppDatabase, DayOfWeek, ReportType, ComplaintStatus } from '../data/types.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';

const VALID_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const VALID_REPORT_TYPES: ReportType[] = ['leak', 'no_water', 'low_supply'];
const VALID_STATUSES: ComplaintStatus[] = ['New', 'In progress', 'Resolved'];

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates duration in minutes: must be a whole number strictly greater than 0.
 */
export function validateDurationMinutes(value: unknown): { isValid: boolean; error?: string; parsed?: number } {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Duration is required.' };
  }
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: 'Duration must be a valid number.' };
  }
  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Duration must be a whole number (no decimals).' };
  }
  if (num <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0 minutes.' };
  }
  return { isValid: true, parsed: num };
}

/**
 * Validates a 24-hour time string in HH:MM format.
 */
export function validateTime(timeStr: string): { isValid: boolean; error?: string } {
  if (!timeStr || !timeStr.trim()) {
    return { isValid: false, error: 'Start time is required.' };
  }
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!regex.test(timeStr.trim())) {
    return { isValid: false, error: 'Start time must be in HH:MM format (24-hour).' };
  }
  return { isValid: true };
}

/**
 * Validates a date string in YYYY-MM-DD format.
 */
export function validateDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: 'Date is required.' };
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr.trim())) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format.' };
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, error: 'Date is invalid.' };
  }
  return { isValid: true };
}

/**
 * Validates text input with character limit and ensures no empty string where required.
 */
export function validateText(
  value: string,
  maxLength: number,
  required: boolean,
  fieldName = 'Field'
): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = value ? value.trim() : '';
  if (required && sanitized.length === 0) {
    return { isValid: false, error: `${fieldName} is required and cannot be blank.`, sanitized: '' };
  }
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} exceeds maximum allowed length of ${maxLength} characters (currently ${sanitized.length}).`,
      sanitized,
    };
  }
  return { isValid: true, sanitized };
}

/**
 * Validates complete database object before import.
 * Returns detailed error message if the file is wrong, damaged, or has unknown schemaVersion.
 */
export function validateImportDatabase(raw: unknown): { isValid: boolean; error?: string; data?: AppDatabase } {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'Import file does not contain a valid JSON object.' };
  }

  const obj = raw as Partial<AppDatabase>;

  if (typeof obj.schemaVersion !== 'number') {
    return { isValid: false, error: 'Missing or invalid schemaVersion in import file.' };
  }

  if (obj.schemaVersion !== 1) {
    return {
      isValid: false,
      error: `Unsupported schemaVersion: ${obj.schemaVersion}. Only version 1 is supported.`,
    };
  }

  if (!Array.isArray(obj.areas) || obj.areas.length === 0) {
    return { isValid: false, error: 'Import file must include a non-empty areas list.' };
  }

  for (const a of obj.areas) {
    if (!a || typeof a.id !== 'string' || typeof a.name !== 'string') {
      return { isValid: false, error: 'One or more areas are malformed.' };
    }
  }

  const areaIdSet = new Set(obj.areas.map((a) => a.id));

  // Validate schedule entries
  if (!Array.isArray(obj.scheduleEntries)) {
    return { isValid: false, error: 'Import file missing scheduleEntries array.' };
  }
  for (const s of obj.scheduleEntries) {
    if (!s || typeof s.id !== 'string' || !areaIdSet.has(s.areaId)) {
      return { isValid: false, error: `Schedule entry refers to an invalid areaId: ${s?.areaId}.` };
    }
    if (!VALID_DAYS.includes(s.dayOfWeek as DayOfWeek)) {
      return { isValid: false, error: `Invalid dayOfWeek in schedule entry: ${s.dayOfWeek}.` };
    }
    const durCheck = validateDurationMinutes(s.durationMinutes);
    if (!durCheck.isValid) {
      return { isValid: false, error: `Schedule entry has invalid duration: ${durCheck.error}` };
    }
    const timeCheck = validateTime(s.startTime);
    if (!timeCheck.isValid) {
      return { isValid: false, error: `Schedule entry has invalid startTime: ${timeCheck.error}` };
    }
  }

  // Validate notices
  if (!Array.isArray(obj.notices)) {
    return { isValid: false, error: 'Import file missing notices array.' };
  }
  for (const n of obj.notices) {
    if (!n || typeof n.id !== 'string') {
      return { isValid: false, error: 'Notice entry is malformed.' };
    }
    if (n.areaId !== '' && !areaIdSet.has(n.areaId)) {
      return { isValid: false, error: `Notice refers to an unknown areaId: ${n.areaId}.` };
    }
    if (typeof n.message !== 'string' || !n.message.trim()) {
      return { isValid: false, error: 'Notice message cannot be empty.' };
    }
  }

  // Validate supply records
  if (!Array.isArray(obj.supplyRecords)) {
    return { isValid: false, error: 'Import file missing supplyRecords array.' };
  }
  for (const sup of obj.supplyRecords) {
    if (!sup || typeof sup.id !== 'string' || !areaIdSet.has(sup.areaId)) {
      return { isValid: false, error: `Supply record refers to unknown areaId: ${sup?.areaId}.` };
    }
    const durCheck = validateDurationMinutes(sup.durationMinutes);
    if (!durCheck.isValid) {
      return { isValid: false, error: `Supply record has invalid duration: ${durCheck.error}` };
    }
    const timeCheck = validateTime(sup.startTime);
    if (!timeCheck.isValid) {
      return { isValid: false, error: `Supply record has invalid startTime: ${timeCheck.error}` };
    }
    const dateCheck = validateDate(sup.date);
    if (!dateCheck.isValid) {
      return { isValid: false, error: `Supply record has invalid date: ${dateCheck.error}` };
    }
  }

  // Validate reports
  if (!Array.isArray(obj.reports)) {
    return { isValid: false, error: 'Import file missing reports array.' };
  }
  for (const r of obj.reports) {
    if (!r || typeof r.id !== 'string' || !areaIdSet.has(r.areaId)) {
      return { isValid: false, error: `Report refers to unknown areaId: ${r?.areaId}.` };
    }
    if (!VALID_REPORT_TYPES.includes(r.type as ReportType)) {
      return { isValid: false, error: `Invalid report type: ${r.type}.` };
    }
    if (!VALID_STATUSES.includes(r.status as ComplaintStatus)) {
      return { isValid: false, error: `Invalid report status: ${r.status}.` };
    }
  }

  // Validate water tests
  if (!Array.isArray(obj.waterTestResults)) {
    return { isValid: false, error: 'Import file missing waterTestResults array.' };
  }
  for (const w of obj.waterTestResults) {
    if (!w || typeof w.id !== 'string') {
      return { isValid: false, error: 'Water test entry is malformed.' };
    }
    if (w.areaId && !areaIdSet.has(w.areaId)) {
      return { isValid: false, error: `Water test refers to unknown areaId: ${w.areaId}.` };
    }
    if (typeof w.result !== 'string' || !w.result.trim()) {
      return { isValid: false, error: 'Water test result cannot be empty.' };
    }
    if (typeof w.source !== 'string' || !w.source.trim()) {
      return { isValid: false, error: 'Water test source cannot be empty.' };
    }
  }

  return { isValid: true, data: obj as AppDatabase };
}
