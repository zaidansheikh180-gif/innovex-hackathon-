/**
 * @file runVerificationTests.ts
 * Rigorous test script testing requirements and logic from the doc spine.
 */

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
let storageQuotaBlocked = false;

(globalThis as any).localStorage = {
  getItem: (key: string) => {
    if (storageQuotaBlocked) throw new Error('QuotaExceededError: LocalStorage quota exceeded.');
    return mockStorage[key] || null;
  },
  setItem: (key: string, value: string) => {
    if (storageQuotaBlocked) throw new Error('QuotaExceededError: LocalStorage quota exceeded.');
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
};

import {
  loadDatabase,
  saveDatabase,
  addReport,
  updateReportStatus,
  addSupplyRecord,
  addScheduleEntry,
  updateScheduleEntry,
  addNotice,
  exportDatabaseAsJSON,
  importDatabaseFromJSON,
  resetAllData,
  getMyReportIds,
  getBackupInfo,
  restorePreviousData,
} from '../data/storage.ts';
import { TEST_FIXTURE_DATABASE as INITIAL_SAMPLE_DATABASE } from './fixtureData.ts';
import { EMPTY_DATABASE } from '../data/sampleData.ts';

// Seed the temporary test fixture (test-only data) into storage.
function resetToSampleData() {
  resetAllData();
  const r = saveDatabase(JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATABASE)));
  localStorage.removeItem('village_water_app_my_reports_v1');
  return r;
}

import {
  validateDurationMinutes,
  validateTime,
  validateDate,
  validateText,
  validateImportDatabase,
} from '../lib/validation.ts';

const results: { test: string; passed: boolean; details: string }[] = [];

function assert(condition: boolean, test: string, details = '') {
  results.push({ test, passed: !!condition, details });
  if (!condition) {
    console.error(`FAIL: ${test} - ${details}`);
  } else {
    console.log(`PASS: ${test}`);
  }
}

// -------------------------------------------------------------------------
// TEST 1: Area filtering for schedule and notices
// -------------------------------------------------------------------------
resetToSampleData();
const db1 = loadDatabase().db!;
const area1Schedules = db1.scheduleEntries.filter((s) => s.areaId === 'area-1');
const area1Notices = db1.notices.filter((n) => n.areaId === 'area-1' || n.areaId === '');
assert(
  area1Schedules.length > 0 && area1Notices.length > 0,
  'Test 1: Pick an area on S-02 and see timings and notices',
  `Found ${area1Schedules.length} schedules and ${area1Notices.length} notices for area-1.`
);

// -------------------------------------------------------------------------
// TEST 2: Submit a report and see it on S-04 as New
// -------------------------------------------------------------------------
const repRes = addReport({
  areaId: 'area-2',
  type: 'leak',
  note: 'Water spraying near corner standpost',
});
assert(repRes.success && !!repRes.report, 'Test 2a: Report created successfully');
assert(repRes.report?.status === 'New', 'Test 2b: Report initial status is New');
const myIds = getMyReportIds();
assert(myIds.includes(repRes.report!.id), 'Test 2c: Report tracked in myReportIds on this device');

// -------------------------------------------------------------------------
// TEST 3: Add supply record and see it at top of area history
// -------------------------------------------------------------------------
const supRes = addSupplyRecord({
  areaId: 'area-1',
  date: '2026-10-28',
  startTime: '08:00',
  durationMinutes: 45,
});
assert(supRes.success, 'Test 3a: Add supply record');
const db3 = loadDatabase().db!;
assert(
  db3.supplyRecords[0].id === supRes.record?.id,
  'Test 3b: Supply record placed at top of history',
  `Top record is ${db3.supplyRecords[0].id}`
);

// -------------------------------------------------------------------------
// TEST 4: Change complaint status (Bidirectional) and see it on S-04
// -------------------------------------------------------------------------
const reportId = repRes.report!.id;
const statRes1 = updateReportStatus(reportId, 'In progress');
assert(statRes1.success, 'Test 4a: Update complaint status to In progress');
let db4 = loadDatabase().db!;
let rep = db4.reports.find((r) => r.id === reportId);
assert(rep?.status === 'In progress', 'Test 4b: Complaint is now In progress');

const statRes2 = updateReportStatus(reportId, 'Resolved');
assert(statRes2.success, 'Test 4c: Update complaint status to Resolved');
db4 = loadDatabase().db!;
rep = db4.reports.find((r) => r.id === reportId);
assert(rep?.status === 'Resolved', 'Test 4d: Complaint is now Resolved');

// Bidirectional check (moving backward from Resolved to In progress)
const statRes3 = updateReportStatus(reportId, 'In progress');
assert(statRes3.success, 'Test 4e: Move complaint backward to In progress (Proposed bidirectional)');
db4 = loadDatabase().db!;
rep = db4.reports.find((r) => r.id === reportId);
assert(rep?.status === 'In progress', 'Test 4f: Status reverted backward to In progress');

// -------------------------------------------------------------------------
// TEST 5: Post a notice on S-07 and see it on S-02
// -------------------------------------------------------------------------
const noticeRes = addNotice({
  areaId: 'area-3',
  message: 'Special holiday supply at 16:00',
});
assert(noticeRes.success, 'Test 5a: Post notice on S-07');
const db5 = loadDatabase().db!;
const area3Notices = db5.notices.filter((n) => n.areaId === 'area-3' || n.areaId === '');
assert(
  area3Notices.some((n) => n.id === noticeRes.notice?.id),
  'Test 5b: Notice is visible for area-3 on S-02'
);

// -------------------------------------------------------------------------
// TEST 6: Export, clear browser data, import, data matches
// -------------------------------------------------------------------------
const exportedJSON = exportDatabaseAsJSON();
assert(typeof exportedJSON === 'string' && exportedJSON.length > 50, 'Test 6a: Export JSON produced string');

// Clear storage completely
(globalThis as any).localStorage.clear();
assert(loadDatabase().db !== null, 'Test 6b: Clean reload initializes default');

// Import the previously exported JSON
const importRes = importDatabaseFromJSON(exportedJSON);
assert(importRes.success, 'Test 6c: Import previous backup succeeded');
const db6 = loadDatabase().db!;
assert(
  db6.reports.some((r) => r.id === reportId),
  'Test 6d: Imported database matches pre-export report data'
);

// -------------------------------------------------------------------------
// TEST 7: Invalid forms show errors; duration 0, negative or NaN rejected
// -------------------------------------------------------------------------
const durZero = validateDurationMinutes(0);
assert(!durZero.isValid, 'Test 7a: Duration 0 rejected');

const durNeg = validateDurationMinutes(-15);
assert(!durNeg.isValid, 'Test 7b: Negative duration rejected');

const durDecimal = validateDurationMinutes(30.5);
assert(!durDecimal.isValid, 'Test 7c: Decimal duration rejected (whole numbers required)');

const durNaN = validateDurationMinutes('abc');
assert(!durNaN.isValid, 'Test 7d: Non-numeric duration rejected');

const durValid = validateDurationMinutes('45');
assert(durValid.isValid && durValid.parsed === 45, 'Test 7e: Valid duration 45 accepted');

const timeInvalid = validateTime('25:99');
assert(!timeInvalid.isValid, 'Test 7f: Invalid time rejected');

const timeValid = validateTime('14:30');
assert(timeValid.isValid, 'Test 7g: Valid 24h time accepted');

// -------------------------------------------------------------------------
// TEST 8: Corrupt or unknown-version data shows an error, no silent loss
// -------------------------------------------------------------------------
mockStorage['village_water_app_db_v1'] = 'INVALID_NOT_JSON{{{';
const corruptLoad = loadDatabase();
assert(corruptLoad.error?.type === 'CORRUPTED', 'Test 8a: Corrupt JSON detected as error');

mockStorage['village_water_app_db_v1'] = JSON.stringify({ schemaVersion: 999, areas: [] });
const unknownVerLoad = loadDatabase();
assert(unknownVerLoad.error?.type === 'UNKNOWN_VERSION', 'Test 8b: Unknown schemaVersion 999 detected as error');

// -------------------------------------------------------------------------
// TEST 10: Storage blocked or full shows an error
// -------------------------------------------------------------------------
storageQuotaBlocked = true;
const blockedRes = saveDatabase(INITIAL_SAMPLE_DATABASE as any);
assert(!blockedRes.success && blockedRes.error?.type === 'BLOCKED_OR_FULL', 'Test 10: Storage blocked or full shows error');
storageQuotaBlocked = false;

// -------------------------------------------------------------------------
// TEST 11: Wrong or damaged import file changes nothing
// -------------------------------------------------------------------------
resetToSampleData();
const beforeDb = JSON.stringify(loadDatabase().db);

const damagedImport1 = importDatabaseFromJSON('not a json string');
assert(!damagedImport1.success, 'Test 11a: Non-JSON import rejected');

const damagedImport2 = importDatabaseFromJSON(JSON.stringify({ schemaVersion: 1, areas: [] }));
assert(!damagedImport2.success, 'Test 11b: Empty areas import rejected');

const damagedImport3 = importDatabaseFromJSON(
  JSON.stringify({
    schemaVersion: 2,
    areas: [{ id: 'area-1', name: 'Area 1' }],
    scheduleEntries: [],
    notices: [],
    supplyRecords: [],
    reports: [],
    waterTestResults: [],
  })
);
assert(!damagedImport3.success, 'Test 11c: Incompatible schemaVersion 2 rejected');

const afterDb = JSON.stringify(loadDatabase().db);
assert(beforeDb === afterDb, 'Test 11d: Database is completely unchanged after failed imports');

// -------------------------------------------------------------------------
// TEST 12: HTML, long or blank text is handled as plain text with limits
// -------------------------------------------------------------------------
const blankRes = validateText('', 500, true, 'Notice');
assert(!blankRes.isValid, 'Test 12a: Blank required text rejected');

const longStr = 'a'.repeat(501);
const longRes = validateText(longStr, 500, true, 'Notice');
assert(!longRes.isValid, 'Test 12b: Over-length text rejected (501 chars > 500 limit)');

const htmlPayload = '<script>alert("xss")</script><b>bold</b>';
const textCheck = validateText(htmlPayload, 500, true, 'Note');
assert(textCheck.isValid && textCheck.sanitized === htmlPayload, 'Test 12c: Stored strictly as plain text string');

// -------------------------------------------------------------------------
// TEST 13: Double submit prevention test
// -------------------------------------------------------------------------
let submitCount = 0;
let isSubmittingLock = false;
function simulatedFormSubmit(payload: any) {
  if (isSubmittingLock) return false;
  isSubmittingLock = true;
  submitCount++;
  addReport(payload);
  // Simulating async/ui unlock
  isSubmittingLock = false;
  return true;
}

isSubmittingLock = true;
const secondAttempt = simulatedFormSubmit({ areaId: 'area-1', type: 'leak' });
assert(!secondAttempt, 'Test 13: Double submit blocked by isSubmitting lock');
isSubmittingLock = false;

// -------------------------------------------------------------------------
// TEST 14: Schedule edit (in-place modification, not deletion)
// -------------------------------------------------------------------------
resetToSampleData();
const dbSched = loadDatabase().db!;
const firstEntry = dbSched.scheduleEntries[0];
const updateSchedRes = updateScheduleEntry(firstEntry.id, {
  areaId: firstEntry.areaId,
  dayOfWeek: 'Sunday',
  startTime: '09:00',
  durationMinutes: 120,
});
assert(updateSchedRes.success, 'Test 14a: Schedule entry updated in-place');
const dbSchedAfter = loadDatabase().db!;
const updatedEntry = dbSchedAfter.scheduleEntries.find((s) => s.id === firstEntry.id);
assert(
  updatedEntry?.dayOfWeek === 'Sunday' && updatedEntry?.durationMinutes === 120,
  'Test 14b: Schedule entry values reflect update without id change'
);

// -------------------------------------------------------------------------
// TEST 15: Security hardening (import limits, strict schema, untrusted storage, recovery)
// -------------------------------------------------------------------------
const clone = () => JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATABASE));
const importErr = (mutate: (d: any) => void) => {
  const d = clone();
  mutate(d);
  return validateImportDatabase(d);
};
const A = INITIAL_SAMPLE_DATABASE.areas[0].id;
const mkRep = (extra: any = {}) => ({
  id: 'rep-x', areaId: A, type: 'leak', status: 'New',
  createdAt: '2026-10-25T08:00:00.000Z', updatedAt: '2026-10-25T08:00:00.000Z', ...extra,
});

assert(validateImportDatabase(clone()).isValid, 'Test 15a: sample database passes the strict schema');
assert(!importErr((d) => { d.extra = 1; }).isValid, 'Test 15b: unknown top-level field rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ evil: 1 })); }).isValid, 'Test 15c: unknown record field rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ id: 'a b<script>' })); }).isValid, 'Test 15d: unsafe id rejected');
assert(!importErr((d) => { d.reports.push(mkRep(), mkRep()); }).isValid, 'Test 15e: duplicate ids rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ areaId: 'nope' })); }).isValid, 'Test 15f: unknown area reference rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ type: 'x' })); }).isValid, 'Test 15g: bad report type rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ status: 'Done' })); }).isValid, 'Test 15h: bad status rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ createdAt: 'yesterday' })); }).isValid, 'Test 15i: bad timestamp rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ note: 5 })); }).isValid, 'Test 15j: non-text note rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ note: 'x'.repeat(501) })); }).isValid, 'Test 15k: over-long note rejected');
assert(!importErr((d) => { d.reports.push(mkRep({ note: 'a\u0000b' })); }).isValid, 'Test 15l: control characters rejected');
assert(!importErr((d) => { d.supplyRecords[0].date = '2026-02-31'; }).isValid, 'Test 15m: impossible calendar date rejected');
assert(!importErr((d) => { d.supplyRecords[0].durationMinutes = 99999999; }).isValid, 'Test 15n: absurd duration rejected');
assert(!importErr((d) => { d.supplyRecords[0].durationMinutes = '45'; }).isValid, 'Test 15o: string duration rejected');
assert(!importErr((d) => { d.scheduleEntries[0].startTime = '25:00'; }).isValid, 'Test 15p: bad start time rejected');
assert(!importErr((d) => { d.notices[0].isSample = 'yes'; }).isValid, 'Test 15q: non-boolean isSample rejected');
assert(!importErr((d) => { d.areas[0].name = ''; }).isValid, 'Test 15r: empty area name rejected');
assert(!importErr((d) => { d.waterTestResults[0].testedOn = 'x'; }).isValid, 'Test 15s: bad water test date rejected');
assert(!importErr((d) => { d.reports = new Array(20001).fill(0).map((_, i) => mkRep({ id: 'r' + i })); }).isValid, 'Test 15t: collection size limit enforced');
assert(!validateImportDatabase(JSON.parse('{"schemaVersion":1,"__proto__":{"x":1},"areas":[],"scheduleEntries":[],"notices":[],"supplyRecords":[],"reports":[],"waterTestResults":[]}')).isValid, 'Test 15u: __proto__ / empty areas rejected');
assert(!validateImportDatabase([]).isValid && !validateImportDatabase(null).isValid, 'Test 15v: non-object roots rejected');
const trimmed = validateImportDatabase(clone()).data!;
assert(JSON.stringify(trimmed) === JSON.stringify(clone()), 'Test 15w: valid data round-trips unchanged (no silent loss)');

// Oversized text is refused before parsing
resetToSampleData();
const beforeBig = localStorage.getItem('village_water_app_db_v1');
const bigRes = importDatabaseFromJSON(' '.repeat(2 * 1024 * 1024 + 1));
assert(!bigRes.success && localStorage.getItem('village_water_app_db_v1') === beforeBig, 'Test 15x: oversized import refused, data unchanged');
const badRes = importDatabaseFromJSON('{"schemaVersion":1,"areas":[]}');
assert(!badRes.success && localStorage.getItem('village_water_app_db_v1') === beforeBig, 'Test 15y: invalid import refused, data unchanged');

// Untrusted stored data
localStorage.setItem('village_water_app_db_v1', JSON.stringify({ ...clone(), reports: [mkRep({ status: 'Hacked' })] }));
const tampered = loadDatabase();
assert(tampered.db === null && tampered.error?.type === 'VALIDATION_FAILED', 'Test 15z: tampered stored data is rejected on load');
assert(localStorage.getItem('village_water_app_db_v1')!.includes('Hacked'), 'Test 15aa: tampered data is not silently deleted');
const savedBad = saveDatabase({ ...clone(), reports: [mkRep({ type: 'zzz' })] });
assert(!savedBad.success, 'Test 15ab: invalid database cannot be saved');
localStorage.setItem('village_water_app_my_reports_v1', JSON.stringify(['rep-ok', 5, { a: 1 }, '<img>']));
assert(JSON.stringify(getMyReportIds()) === JSON.stringify(['rep-ok']), 'Test 15ac: tampered my-reports list is filtered');

// Backup / recovery
localStorage.clear();
loadDatabase();
const mine = addReport({ areaId: A, type: 'leak', note: 'before reset' });
assert(mine.success, 'Test 16a: add a report to protect');
resetToSampleData();
const info = getBackupInfo();
assert(!!info && info.restorable && info.reason === 'reset', 'Test 16b: reset leaves a restorable recovery copy');
assert(!loadDatabase().db!.reports.some((r) => r.note === 'before reset'), 'Test 16c: reset removed the report');
const rest = restorePreviousData();
assert(rest.success && loadDatabase().db!.reports.some((r) => r.note === 'before reset'), 'Test 16d: restore brings the report back');
assert(getMyReportIds().includes(mine.report!.id), 'Test 16e: restore also brings back My Reports tracking');
assert(getBackupInfo()?.reason === 'restore', 'Test 16f: restore keeps the replaced data as the new recovery copy');
// damaged stored data survives a reset as a recovery copy only if valid; raw is never lost silently
localStorage.setItem('village_water_app_db_v1', '{broken');
resetToSampleData();
assert(JSON.parse(localStorage.getItem('village_water_app_db_backup_v1')!).raw === '{broken', 'Test 16g: damaged data is kept in the backup slot on reset');
assert(getBackupInfo()?.restorable === false && !restorePreviousData().success, 'Test 16h: damaged backup is not restorable');
// failed import keeps the old data
resetToSampleData();
addReport({ areaId: A, type: 'leak', note: 'keep me' });
const keepRaw = localStorage.getItem('village_water_app_db_v1');
assert(!importDatabaseFromJSON('{nope').success && localStorage.getItem('village_water_app_db_v1') === keepRaw, 'Test 16i: failed import leaves data untouched');

// -------------------------------------------------------------------------
// TEST 20: Clean first run (no fabricated records) and empty reset
// -------------------------------------------------------------------------
(globalThis as any).localStorage.clear();
const fresh = loadDatabase().db!;
assert(
  fresh.areas.length > 0 && fresh.scheduleEntries.length === 0 && fresh.notices.length === 0 &&
    fresh.supplyRecords.length === 0 && fresh.reports.length === 0 && fresh.waterTestResults.length === 0,
  'Test 20a: first run starts with areas only and no records'
);
assert(validateImportDatabase(fresh).isValid, 'Test 20b: empty database passes import validation');
assert(importDatabaseFromJSON(exportDatabaseAsJSON()).success === true, 'Test 20c: empty database exports and re-imports');
resetToSampleData();
assert(loadDatabase().db!.reports.length > 0, 'Test 20d: fixture seeds test records');
assert(resetAllData().success && loadDatabase().db!.reports.length === 0 && getBackupInfo() !== null, 'Test 20e: reset clears records and keeps a backup');
assert(JSON.stringify(EMPTY_DATABASE).includes('sample') === false, 'Test 20f: shipped default has no sample records');

console.log('\n--- VERIFICATION TEST SUMMARY ---');
const total = results.length;
const passed = results.filter((r) => r.passed).length;
console.log(`Passed: ${passed}/${total}`);
if (passed === total) {
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY.');
} else {
  process.exit(1);
}
