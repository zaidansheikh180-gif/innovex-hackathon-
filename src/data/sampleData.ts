/**
 * @file sampleData.ts
 * Initial database for a new install: configuration (areas) only, no records.
 * Test fixtures live in src/tests/fixtureData.ts and are never shipped.
 */

import { AppDatabase } from './types.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';

export const EMPTY_DATABASE: AppDatabase = {
  schemaVersion: 1,
  areas: [...PLACEHOLDERS.areas],
  scheduleEntries: [],
  notices: [],
  supplyRecords: [],
  reports: [],
  waterTestResults: [],
};
