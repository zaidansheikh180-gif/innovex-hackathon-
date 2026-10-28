/**
 * @file types.ts
 * Data model types for the JalSetu app.
 * Schema version: 1
 */

export type UserRole = 'resident' | 'operator';

export type ReportType = 'leak' | 'no_water' | 'low_supply';

export type ComplaintStatus = 'New' | 'In progress' | 'Resolved';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface Area {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  id: string;
  areaId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" 24h format
  durationMinutes: number; // Whole number > 0
  isSample?: boolean;
}

export interface Notice {
  id: string;
  areaId: string; // empty string "" indicates all areas
  message: string;
  createdAt: string; // ISO string
  isSample?: boolean;
}

export interface SupplyRecord {
  id: string;
  areaId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  durationMinutes: number; // Whole number > 0
  createdAt: string; // ISO string
  isSample?: boolean;
}

export interface Report {
  id: string;
  areaId: string;
  type: ReportType;
  note?: string; // Optional user note, plain text
  status: ComplaintStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isSample?: boolean;
}

export interface WaterTestResult {
  id: string;
  areaId?: string; // Optional specific area
  testedOn: string; // "YYYY-MM-DD"
  result: string; // Raw text as given by testing authority
  source: string; // Name of external testing authority
  enteredAt: string; // ISO string
  isSample?: boolean;
}

export interface AppDatabase {
  schemaVersion: number;
  areas: Area[];
  scheduleEntries: ScheduleEntry[];
  notices: Notice[];
  supplyRecords: SupplyRecord[];
  reports: Report[];
  waterTestResults: WaterTestResult[];
}
