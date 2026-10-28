/**
 * @file OperatorScheduleScreen.tsx
 * Screen S-07: /operator/schedule (Operator)
 * Manage planned schedule entries (add AND edit in-place) and post notices.
 * Strict policy: NO INDIVIDUAL RECORD DELETION.
 */

import React, { useState } from 'react';
import { AppDatabase, Area, DayOfWeek, ScheduleEntry } from '../data/types.ts';
import {
  addScheduleEntry,
  updateScheduleEntry,
  addNotice,
} from '../data/storage.ts';
import {
  validateDurationMinutes,
  validateTime,
  validateText,
} from '../lib/validation.ts';
import { formatTime24to12, formatISODateTime } from '../lib/dateUtils.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import { SampleBadge } from '../components/SampleBadge.tsx';
import {
  Sliders,
  PlusCircle,
  Bell,
  CheckCircle,
  Edit2,
  XCircle,
  Clock,
} from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface OperatorScheduleScreenProps {
  db: AppDatabase;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const OperatorScheduleScreen: React.FC<OperatorScheduleScreenProps> = ({ db }) => {
  // ---------------------------------------------------------
  // SCHEDULE FORM STATE (Add or Edit)
  // ---------------------------------------------------------
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedAreaId, setSchedAreaId] = useState<string>(db.areas[0]?.id || 'area-1');
  const [schedDay, setSchedDay] = useState<DayOfWeek>('Monday');
  const [schedTime, setSchedTime] = useState<string>('07:00');
  const [schedDuration, setSchedDuration] = useState<string>('60');

  const [schedErrors, setSchedErrors] = useState<Record<string, string>>({});
  const [isSchedSubmitting, setIsSchedSubmitting] = useState<boolean>(false);
  const [schedSuccessMessage, setSchedSuccessMessage] = useState<string | null>(null);

  // ---------------------------------------------------------
  // NOTICE FORM STATE
  // ---------------------------------------------------------
  const [noticeAreaId, setNoticeAreaId] = useState<string>(''); // "" = all areas
  const [noticeMessage, setNoticeMessage] = useState<string>('');

  const [noticeErrors, setNoticeErrors] = useState<Record<string, string>>({});
  const [isNoticeSubmitting, setIsNoticeSubmitting] = useState<boolean>(false);
  const [noticeSuccessMessage, setNoticeSuccessMessage] = useState<string | null>(null);

  // Start editing an entry
  const startEditing = (entry: ScheduleEntry) => {
    setEditingScheduleId(entry.id);
    setSchedAreaId(entry.areaId);
    setSchedDay(entry.dayOfWeek);
    setSchedTime(entry.startTime);
    setSchedDuration(String(entry.durationMinutes));
    setSchedErrors({});
    // Scroll smoothly to form
    document.getElementById('schedule-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingScheduleId(null);
    setSchedErrors({});
    setSchedAreaId(db.areas[0]?.id || 'area-1');
    setSchedDay('Monday');
    setSchedTime('07:00');
    setSchedDuration('60');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSchedSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!schedAreaId) {
      newErrors.areaId = 'Area is required.';
    }

    const timeCheck = validateTime(schedTime);
    if (!timeCheck.isValid) {
      newErrors.time = timeCheck.error || 'Start time is invalid.';
    }

    const durCheck = validateDurationMinutes(schedDuration);
    if (!durCheck.isValid || durCheck.parsed === undefined) {
      newErrors.duration = durCheck.error || 'Duration must be a whole number greater than 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setSchedErrors(newErrors);
      return;
    }

    setSchedErrors({});
    setIsSchedSubmitting(true);

    try {
      if (editingScheduleId) {
        // Edit in-place
        const res = updateScheduleEntry(editingScheduleId, {
          areaId: schedAreaId,
          dayOfWeek: schedDay,
          startTime: schedTime,
          durationMinutes: durCheck.parsed!,
        });

        if (!res.success) {
          setSchedErrors({ form: res.error || 'Failed to update schedule entry.' });
          setIsSchedSubmitting(false);
          return;
        }

        setSchedSuccessMessage('Schedule entry updated successfully.');
        setEditingScheduleId(null);
      } else {
        // Add new
        const res = addScheduleEntry({
          areaId: schedAreaId,
          dayOfWeek: schedDay,
          startTime: schedTime,
          durationMinutes: durCheck.parsed!,
        });

        if (!res.success) {
          setSchedErrors({ form: res.error || 'Failed to save schedule entry.' });
          setIsSchedSubmitting(false);
          return;
        }

        setSchedSuccessMessage('New schedule entry added.');
      }

      setIsSchedSubmitting(false);
      setTimeout(() => setSchedSuccessMessage(null), 4000);
    } catch (err: any) {
      setSchedErrors({ form: err?.message || 'Error occurred.' });
      setIsSchedSubmitting(false);
    }
  };

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNoticeSubmitting) return;

    const newErrors: Record<string, string> = {};

    const textCheck = validateText(
      noticeMessage,
      PLACEHOLDERS.textLimits.noticeMessage,
      true,
      'Notice message'
    );
    if (!textCheck.isValid) {
      newErrors.message = textCheck.error || 'Notice message cannot be blank.';
    }

    if (Object.keys(newErrors).length > 0) {
      setNoticeErrors(newErrors);
      return;
    }

    setNoticeErrors({});
    setIsNoticeSubmitting(true);

    try {
      const res = addNotice({
        areaId: noticeAreaId,
        message: textCheck.sanitized,
      });

      if (!res.success) {
        setNoticeErrors({ form: res.error || 'Failed to post notice.' });
        setIsNoticeSubmitting(false);
        return;
      }

      setNoticeSuccessMessage('Notice posted successfully and is now visible to residents.');
      setNoticeMessage('');
      setIsNoticeSubmitting(false);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } catch (err: any) {
      setNoticeErrors({ form: err?.message || 'Error posting notice.' });
      setIsNoticeSubmitting(false);
    }
  };

  const getAreaName = (areaId: string) => {
    if (areaId === '') return 'All Areas (Village-Wide)';
    const area = db.areas.find((a) => a.id === areaId);
    return area ? area.name : areaId;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-700" />
            <span>Manage Schedule & Notices</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Operator View
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Configure planned water distribution slots per area and publish notices for maintenance or delays.
        </p>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: POST A DELAY / SERVICE NOTICE                 */}
      {/* ========================================================= */}
      <section aria-labelledby="post-notice-heading" className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="post-notice-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Post a Delay or Service Notice (FR-002)</span>
          </h2>
        </div>

        {noticeSuccessMessage && (
          <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs font-semibold text-emerald-950 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{noticeSuccessMessage}</span>
          </div>
        )}

        {noticeErrors.form && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-semibold">
            {noticeErrors.form}
          </div>
        )}

        <form onSubmit={handleNoticeSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="notice-area-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Notice Target Area <span className="text-rose-600">*</span>
              </label>
              <select
                id="notice-area-select"
                value={noticeAreaId}
                onChange={(e) => setNoticeAreaId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              >
                <option value="">All Areas (Village-Wide)</option>
                {db.areas.map((a: Area) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="notice-msg" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Notice Message <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {noticeMessage.length} / {PLACEHOLDERS.textLimits.noticeMessage}
              </span>
            </div>
            <textarea
              id="notice-msg"
              rows={2}
              value={noticeMessage}
              maxLength={PLACEHOLDERS.textLimits.noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              placeholder="e.g. Morning supply delayed by 45 minutes due to electrical pump maintenance."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              aria-describedby={noticeErrors.message ? 'notice-error' : undefined}
            />
            {noticeErrors.message && (
              <p id="notice-error" className="mt-1 text-xs text-rose-600 font-medium">
                {noticeErrors.message}
              </p>
            )}
          </div>

          <GlassButton
            type="submit"
            disabled={isNoticeSubmitting}
            tone="amber" className="px-5 py-2 font-semibold text-xs sm:text-sm"
          >
            {isNoticeSubmitting ? 'Posting Notice...' : 'Publish Notice'}
          </GlassButton>
        </form>

        {/* List of active notices */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Currently Published Notices ({db.notices.length})
          </h3>
          {db.notices.length === 0 ? (
            <p className="text-xs text-slate-500">No active notices.</p>
          ) : (
            <div className="space-y-2">
              {db.notices.map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">{getAreaName(n.areaId)}</span>
                    <div className="flex items-center gap-2">
                      {n.isSample && <SampleBadge />}
                      <span>{formatISODateTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap break-words">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: SCHEDULE ENTRIES (ADD & EDIT IN-PLACE)        */}
      {/* ========================================================= */}
      <section
        id="schedule-form-container"
        aria-labelledby="schedule-heading"
        className="bg-white p-6 rounded-lg border border-slate-200 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 id="schedule-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>
                {editingScheduleId ? 'Edit Schedule Entry' : 'Add New Schedule Entry'} (FR-001)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingScheduleId
                ? 'Modifying selected entry in-place. Editing preserves identity and is distinct from deletion.'
                : 'Define planned supply days and durations for village areas.'}
            </p>
          </div>

          {editingScheduleId && (
            <GlassButton
              type="button"
              onClick={cancelEditing}
              tone="neutral" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Editing</span>
            </GlassButton>
          )}
        </div>

        {schedSuccessMessage && (
          <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs font-semibold text-emerald-950 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{schedSuccessMessage}</span>
          </div>
        )}

        {schedErrors.form && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-semibold">
            {schedErrors.form}
          </div>
        )}

        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Area */}
            <div>
              <label htmlFor="sched-area" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Area <span className="text-rose-600">*</span>
              </label>
              <select
                id="sched-area"
                value={schedAreaId}
                onChange={(e) => setSchedAreaId(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              >
                {db.areas.map((a: Area) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label htmlFor="sched-day" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Day of Week <span className="text-rose-600">*</span>
              </label>
              <select
                id="sched-day"
                value={schedDay}
                onChange={(e) => setSchedDay(e.target.value as DayOfWeek)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="sched-time" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Start Time (HH:MM) <span className="text-rose-600">*</span>
              </label>
              <input
                id="sched-time"
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
              {schedErrors.time && (
                <p className="mt-1 text-xs text-rose-600">{schedErrors.time}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="sched-dur" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Duration (Min &gt; 0) <span className="text-rose-600">*</span>
              </label>
              <input
                id="sched-dur"
                type="number"
                min="1"
                step="1"
                value={schedDuration}
                onChange={(e) => setSchedDuration(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
              {schedErrors.duration && (
                <p className="mt-1 text-xs text-rose-600">{schedErrors.duration}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton
              type="submit"
              disabled={isSchedSubmitting}
              tone="teal" className="px-5 py-2.5 font-semibold text-xs sm:text-sm"
            >
              {isSchedSubmitting
                ? 'Saving...'
                : editingScheduleId
                ? 'Save Schedule Updates'
                : 'Add Schedule Slot'}
            </GlassButton>
            {editingScheduleId && (
              <GlassButton
                type="button"
                onClick={cancelEditing}
                tone="neutral" className="px-4 py-2.5 text-xs sm:text-sm font-medium"
              >
                Cancel
              </GlassButton>
            )}
          </div>
        </form>

        {/* Existing Schedule Entries Table */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Configured Schedules ({db.scheduleEntries.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              (No individual deletions allowed; use Edit to modify)
            </span>
          </div>

          {db.scheduleEntries.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
              No timings set yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Area</th>
                    <th className="p-2.5">Day</th>
                    <th className="p-2.5">Start Time</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {db.scheduleEntries.map((item) => (
                    <tr
                      key={item.id}
                      className={editingScheduleId === item.id ? 'bg-teal-50 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="p-2.5 font-bold text-slate-900">{getAreaName(item.areaId)}</td>
                      <td className="p-2.5 text-slate-800">{item.dayOfWeek}</td>
                      <td className="p-2.5 text-slate-800">
                        {formatTime24to12(item.startTime)}{' '}
                        <span className="text-[10px] text-slate-500">({item.startTime})</span>
                      </td>
                      <td className="p-2.5 text-slate-800">{item.durationMinutes} min</td>
                      <td className="p-2.5">
                        {item.isSample ? <SampleBadge /> : <span className="text-slate-500 text-[11px]">User Record</span>}
                      </td>
                      <td className="p-2.5 text-right">
                        <GlassButton
                          type="button"
                          onClick={() => startEditing(item)}
                          tone="neutral" className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold"
                          aria-label={`Edit schedule for ${getAreaName(item.areaId)} on ${item.dayOfWeek}`}
                        >
                          <Edit2 className="w-3 h-3 text-teal-700" />
                          <span>Edit</span>
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
