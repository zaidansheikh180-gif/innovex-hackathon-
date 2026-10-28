/**
 * @file validation.ts
 * Validation helpers for form inputs, text length limits, and import files.
 */

import {
  AppDatabase,
  DayOfWeek,
  ReportType,
  ComplaintStatus,
  ScheduleEntry,
  Notice,
  SupplyRecord,
  Report,
  WaterTestResult,
} from '../data/types.ts';
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
  const [y, m, d] = dateStr.trim().split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
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

/** Resource limits applied to imported files and to data read back from browser storage. */
export const IMPORT_LIMITS = {
  maxFileBytes: 2 * 1024 * 1024,
  maxJsonChars: 2 * 1024 * 1024,
  maxAreas: 200,
  maxScheduleEntries: 5000,
  maxNotices: 5000,
  maxSupplyRecords: 20000,
  maxReports: 20000,
  maxWaterTests: 5000,
  maxIdLength: 100,
  maxAreaName: 100,
  maxDurationMinutes: 525600, // one year
} as const;

const ID_REGEX = /^[A-Za-z0-9_-]+$/;
const ISO_TS_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type Rec = Record<string, unknown>;
type Fail = { ok: false; error: string };

function isPlainObject(v: unknown): v is Rec {
  return !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

function checkKeys(o: Rec, allowed: string[], label: string): string | null {
  for (const k of Object.keys(o)) {
    if (!allowed.includes(k)) return `${label} has an unexpected field "${k.slice(0, 40)}".`;
  }
  return null;
}

function checkId(v: unknown, label: string): string | null {
  if (typeof v !== 'string' || v.length === 0 || v.length > IMPORT_LIMITS.maxIdLength || !ID_REGEX.test(v)) {
    return `${label} has an invalid id.`;
  }
  return null;
}

function checkString(v: unknown, label: string, max: number, required: boolean): string | null {
  if (typeof v !== 'string') return `${label} must be text.`;
  if (v.length > max) return `${label} is longer than ${max} characters.`;
  if (required && v.trim().length === 0) return `${label} cannot be empty.`;
  if (CONTROL_CHARS.test(v)) return `${label} contains control characters.`;
  return null;
}

function checkTimestamp(v: unknown, label: string): string | null {
  if (typeof v !== 'string' || !ISO_TS_REGEX.test(v) || isNaN(Date.parse(v))) {
    return `${label} is not a valid timestamp.`;
  }
  return null;
}

function checkOptionalBool(v: unknown, label: string): string | null {
  if (v !== undefined && typeof v !== 'boolean') return `${label} must be true or false.`;
  return null;
}

function checkDuration(v: unknown, label: string): string | null {
  const d = typeof v === 'number' ? validateDurationMinutes(v) : { isValid: false, error: 'must be a number.' };
  if (!d.isValid) return `${label} duration is invalid: ${d.error}`;
  if ((v as number) > IMPORT_LIMITS.maxDurationMinutes) return `${label} duration is too large.`;
  return null;
}

function checkList(v: unknown, label: string, max: number): v is unknown[] {
  return Array.isArray(v) && v.length <= max;
}

/**
 * Validates a complete database object (used for imports AND for data read back from storage).
 * Strict: every collection, field, type, enum, date, id and reference is checked, unknown
 * fields are rejected, and a fresh sanitized copy (only known fields) is returned.
 * Nothing is written by this function.
 */
export function validateImportDatabase(raw: unknown): { isValid: boolean; error?: string; data?: AppDatabase } {
  const fail = (error: string) => ({ isValid: false as const, error });

  if (!isPlainObject(raw)) return fail('Import file does not contain a valid JSON object.');
  const err0 = checkKeys(
    raw,
    ['schemaVersion', 'areas', 'scheduleEntries', 'notices', 'supplyRecords', 'reports', 'waterTestResults'],
    'Database'
  );
  if (err0) return fail(err0);

  if (typeof raw.schemaVersion !== 'number') return fail('Missing or invalid schemaVersion in import file.');
  if (raw.schemaVersion !== 1) {
    return fail(`Unsupported schemaVersion: ${String(raw.schemaVersion).slice(0, 20)}. Only version 1 is supported.`);
  }

  const L = IMPORT_LIMITS;
  const lists: [string, number][] = [
    ['areas', L.maxAreas],
    ['scheduleEntries', L.maxScheduleEntries],
    ['notices', L.maxNotices],
    ['supplyRecords', L.maxSupplyRecords],
    ['reports', L.maxReports],
    ['waterTestResults', L.maxWaterTests],
  ];
  for (const [name, max] of lists) {
    const v = raw[name];
    if (!Array.isArray(v)) return fail(`Import file missing ${name} array.`);
    if (!checkList(v, name, max)) return fail(`${name} has too many records (limit ${max}).`);
  }
  if ((raw.areas as unknown[]).length === 0) return fail('Import file must include a non-empty areas list.');

  const seen = (items: Rec[]) => new Set(items.map((i) => i.id as string)).size === items.length;
  const first = <T,>(items: unknown[], fn: (o: Rec, i: number) => string | T): { err?: string; out: T[] } => {
    const out: T[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!isPlainObject(it)) return { err: 'A record is not an object.', out };
      const r = fn(it, i);
      if (typeof r === 'string') return { err: r, out };
      out.push(r as T);
    }
    return { out };
  };

  // Areas
  const areasRes = first<{ id: string; name: string }>(raw.areas as unknown[], (a) => {
    const e =
      checkKeys(a, ['id', 'name'], 'Area') ||
      checkId(a.id, 'Area') ||
      checkString(a.name, 'Area name', L.maxAreaName, true);
    return e || { id: a.id as string, name: a.name as string };
  });
  if (areasRes.err) return fail(areasRes.err);
  const areaIds = new Set(areasRes.out.map((a) => a.id));
  if (areaIds.size !== areasRes.out.length) return fail('Duplicate area ids.');

  const common = (o: Rec, label: string, extra: string[]) =>
    checkKeys(o, ['id', 'areaId', 'isSample', ...extra], label) ||
    checkId(o.id, label) ||
    checkOptionalBool(o.isSample, `${label} isSample`);
  const sampleOf = (o: Rec) => (o.isSample === undefined ? {} : { isSample: o.isSample as boolean });
  const needArea = (o: Rec, label: string) =>
    typeof o.areaId === 'string' && areaIds.has(o.areaId) ? null : `${label} refers to an unknown area.`;

  // Schedule entries
  const sched = first<ScheduleEntry>(raw.scheduleEntries as unknown[], (s) => {
    const e =
      common(s, 'Schedule entry', ['dayOfWeek', 'startTime', 'durationMinutes']) ||
      needArea(s, 'Schedule entry') ||
      (VALID_DAYS.includes(s.dayOfWeek as DayOfWeek) ? null : 'Schedule entry has an invalid day of week.') ||
      (typeof s.startTime === 'string' && validateTime(s.startTime).isValid && s.startTime === s.startTime.trim()
        ? null
        : 'Schedule entry has an invalid start time.') ||
      checkDuration(s.durationMinutes, 'Schedule entry');
    return (
      e || {
        id: s.id as string,
        areaId: s.areaId as string,
        dayOfWeek: s.dayOfWeek as DayOfWeek,
        startTime: s.startTime as string,
        durationMinutes: s.durationMinutes as number,
        ...sampleOf(s),
      }
    );
  });
  if (sched.err) return fail(sched.err);
  if (!seen(sched.out as unknown as Rec[])) return fail('Duplicate schedule entry ids.');

  // Notices
  const notes = first<Notice>(raw.notices as unknown[], (n) => {
    const e =
      checkKeys(n, ['id', 'areaId', 'message', 'createdAt', 'isSample'], 'Notice') ||
      checkId(n.id, 'Notice') ||
      checkOptionalBool(n.isSample, 'Notice isSample') ||
      (n.areaId === '' || (typeof n.areaId === 'string' && areaIds.has(n.areaId))
        ? null
        : 'Notice refers to an unknown area.') ||
      checkString(n.message, 'Notice message', PLACEHOLDERS.textLimits.noticeMessage, true) ||
      checkTimestamp(n.createdAt, 'Notice createdAt');
    return (
      e || {
        id: n.id as string,
        areaId: n.areaId as string,
        message: n.message as string,
        createdAt: n.createdAt as string,
        ...sampleOf(n),
      }
    );
  });
  if (notes.err) return fail(notes.err);
  if (!seen(notes.out as unknown as Rec[])) return fail('Duplicate notice ids.');

  // Supply records
  const sup = first<SupplyRecord>(raw.supplyRecords as unknown[], (r) => {
    const e =
      common(r, 'Supply record', ['date', 'startTime', 'durationMinutes', 'createdAt']) ||
      needArea(r, 'Supply record') ||
      (typeof r.date === 'string' && validateDate(r.date).isValid ? null : 'Supply record has an invalid date.') ||
      (typeof r.startTime === 'string' && validateTime(r.startTime).isValid && r.startTime === r.startTime.trim()
        ? null
        : 'Supply record has an invalid start time.') ||
      checkDuration(r.durationMinutes, 'Supply record') ||
      checkTimestamp(r.createdAt, 'Supply record createdAt');
    return (
      e || {
        id: r.id as string,
        areaId: r.areaId as string,
        date: r.date as string,
        startTime: r.startTime as string,
        durationMinutes: r.durationMinutes as number,
        createdAt: r.createdAt as string,
        ...sampleOf(r),
      }
    );
  });
  if (sup.err) return fail(sup.err);
  if (!seen(sup.out as unknown as Rec[])) return fail('Duplicate supply record ids.');

  // Reports
  const reps = first<Report>(raw.reports as unknown[], (r) => {
    const e =
      common(r, 'Report', ['type', 'note', 'status', 'createdAt', 'updatedAt']) ||
      needArea(r, 'Report') ||
      (VALID_REPORT_TYPES.includes(r.type as ReportType) ? null : 'Report has an invalid type.') ||
      (VALID_STATUSES.includes(r.status as ComplaintStatus) ? null : 'Report has an invalid status.') ||
      (r.note === undefined ? null : checkString(r.note, 'Report note', PLACEHOLDERS.textLimits.reportNote, false)) ||
      checkTimestamp(r.createdAt, 'Report createdAt') ||
      checkTimestamp(r.updatedAt, 'Report updatedAt');
    return (
      e || {
        id: r.id as string,
        areaId: r.areaId as string,
        type: r.type as ReportType,
        ...(r.note === undefined ? {} : { note: r.note as string }),
        status: r.status as ComplaintStatus,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
        ...sampleOf(r),
      }
    );
  });
  if (reps.err) return fail(reps.err);
  if (!seen(reps.out as unknown as Rec[])) return fail('Duplicate report ids.');

  // Water tests
  const tests = first<WaterTestResult>(raw.waterTestResults as unknown[], (w) => {
    const e =
      checkKeys(w, ['id', 'areaId', 'testedOn', 'result', 'source', 'enteredAt', 'isSample'], 'Water test') ||
      checkId(w.id, 'Water test') ||
      checkOptionalBool(w.isSample, 'Water test isSample') ||
      (w.areaId === undefined || w.areaId === '' || (typeof w.areaId === 'string' && areaIds.has(w.areaId))
        ? null
        : 'Water test refers to an unknown area.') ||
      (typeof w.testedOn === 'string' && validateDate(w.testedOn).isValid ? null : 'Water test has an invalid date.') ||
      checkString(w.result, 'Water test result', PLACEHOLDERS.textLimits.waterTestResult, true) ||
      checkString(w.source, 'Water test source', PLACEHOLDERS.textLimits.waterTestSource, true) ||
      checkTimestamp(w.enteredAt, 'Water test enteredAt');
    return (
      e || {
        id: w.id as string,
        ...(w.areaId === undefined ? {} : { areaId: w.areaId as string }),
        testedOn: w.testedOn as string,
        result: w.result as string,
        source: w.source as string,
        enteredAt: w.enteredAt as string,
        ...sampleOf(w),
      }
    );
  });
  if (tests.err) return fail(tests.err);
  if (!seen(tests.out as unknown as Rec[])) return fail('Duplicate water test ids.');

  const data: AppDatabase = {
    schemaVersion: 1,
    areas: areasRes.out,
    scheduleEntries: sched.out,
    notices: notes.out,
    supplyRecords: sup.out,
    reports: reps.out,
    waterTestResults: tests.out,
  };
  return { isValid: true, data };
}
