/**
 * @file fixtureData.ts
 * TEST-ONLY fixture records used by the verification tests.
 * Not imported by the app, so it is never shipped as a default.
 */

import { AppDatabase } from '../data/types.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';

export const TEST_FIXTURE_DATABASE: AppDatabase = {
  schemaVersion: 1,
  areas: [...PLACEHOLDERS.areas],
  scheduleEntries: [
    {
      id: 'sched-sample-1',
      areaId: 'area-1',
      dayOfWeek: 'Monday',
      startTime: '06:30',
      durationMinutes: 90,
      isSample: true,
    },
    {
      id: 'sched-sample-2',
      areaId: 'area-1',
      dayOfWeek: 'Thursday',
      startTime: '06:30',
      durationMinutes: 90,
      isSample: true,
    },
    {
      id: 'sched-sample-3',
      areaId: 'area-2',
      dayOfWeek: 'Tuesday',
      startTime: '07:00',
      durationMinutes: 60,
      isSample: true,
    },
    {
      id: 'sched-sample-4',
      areaId: 'area-2',
      dayOfWeek: 'Friday',
      startTime: '07:00',
      durationMinutes: 60,
      isSample: true,
    },
    {
      id: 'sched-sample-5',
      areaId: 'area-3',
      dayOfWeek: 'Wednesday',
      startTime: '17:00',
      durationMinutes: 75,
      isSample: true,
    },
    {
      id: 'sched-sample-6',
      areaId: 'area-3',
      dayOfWeek: 'Saturday',
      startTime: '17:00',
      durationMinutes: 75,
      isSample: true,
    },
  ],
  notices: [
    {
      id: 'notice-sample-1',
      areaId: '', // All areas
      message: 'Sample notice: Main pump maintenance planned for Wednesday morning.',
      createdAt: '2026-10-25T08:00:00.000Z',
      isSample: true,
    },
    {
      id: 'notice-sample-2',
      areaId: 'area-1',
      message: 'Sample notice: Supply delayed by 30 minutes due to pipe inspection.',
      createdAt: '2026-10-26T06:00:00.000Z',
      isSample: true,
    },
  ],
  supplyRecords: [
    {
      id: 'supply-sample-1',
      areaId: 'area-1',
      date: '2026-10-26',
      startTime: '07:00',
      durationMinutes: 80,
      createdAt: '2026-10-26T08:25:00.000Z',
      isSample: true,
    },
    {
      id: 'supply-sample-2',
      areaId: 'area-2',
      date: '2026-10-24',
      startTime: '07:05',
      durationMinutes: 55,
      createdAt: '2026-10-24T08:05:00.000Z',
      isSample: true,
    },
    {
      id: 'supply-sample-3',
      areaId: 'area-3',
      date: '2026-10-25',
      startTime: '17:15',
      durationMinutes: 70,
      createdAt: '2026-10-25T18:30:00.000Z',
      isSample: true,
    },
  ],
  reports: [
    {
      id: 'report-sample-1',
      areaId: 'area-1',
      type: 'leak',
      note: 'Sample report: Visible leak observed near standpost valve.',
      status: 'In progress',
      createdAt: '2026-10-26T07:15:00.000Z',
      updatedAt: '2026-10-26T09:30:00.000Z',
      isSample: true,
    },
    {
      id: 'report-sample-2',
      areaId: 'area-2',
      type: 'low_supply',
      note: 'Sample report: Water pressure was significantly lower than usual.',
      status: 'New',
      createdAt: '2026-10-27T07:45:00.000Z',
      updatedAt: '2026-10-27T07:45:00.000Z',
      isSample: true,
    },
    {
      id: 'report-sample-3',
      areaId: 'area-3',
      type: 'no_water',
      note: 'Sample report: No water reached the lower lane during scheduled slot.',
      status: 'Resolved',
      createdAt: '2026-10-24T18:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
      isSample: true,
    },
  ],
  waterTestResults: [
    {
      id: 'test-sample-1',
      areaId: 'area-1',
      testedOn: '2026-10-20',
      result: 'Turbidity within acceptable range; chlorination residual test: satisfactory.',
      source: 'District Rural Water Testing Laboratory (Sample report #841)',
      enteredAt: '2026-10-21T11:00:00.000Z',
      isSample: true,
    },
    {
      id: 'test-sample-2',
      testedOn: '2026-10-10',
      result: 'Routine microbiological screening: no coliform detected.',
      source: 'Sub-Divisional Public Health Engineering Unit (Sample test #729)',
      enteredAt: '2026-10-12T14:30:00.000Z',
      isSample: true,
    },
  ],
};
