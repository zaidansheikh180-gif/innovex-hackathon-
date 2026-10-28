/**
 * @file ResidentScheduleScreen.tsx
 * Screen S-02: /schedule (Resident)
 * Pick area, view planned timings (FR-001) and active delay notices (FR-002).
 */

import React, { useState, useMemo } from 'react';
import { AppDatabase, Area } from '../data/types.ts';
import { SampleBadge } from '../components/SampleBadge.tsx';
import { formatTime24to12, formatISODateTime } from '../lib/dateUtils.ts';
import { Clock, AlertCircle, Info, Calendar } from 'lucide-react';

interface ResidentScheduleScreenProps {
  db: AppDatabase;
  onNavigate: (path: string) => void;
}

export const ResidentScheduleScreen: React.FC<ResidentScheduleScreenProps> = ({
  db,
  onNavigate,
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    db.areas[0]?.id || 'area-1'
  );

  const selectedArea = db.areas.find((a) => a.id === selectedAreaId);

  // Schedules for selected area
  const areaSchedules = useMemo(() => {
    return db.scheduleEntries.filter((s) => s.areaId === selectedAreaId);
  }, [db.scheduleEntries, selectedAreaId]);

  // Notices for selected area or all areas (empty areaId)
  const activeNotices = useMemo(() => {
    return db.notices.filter(
      (n) => n.areaId === selectedAreaId || n.areaId === ''
    );
  }, [db.notices, selectedAreaId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-700" />
            <span>Water Schedule & Notices</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Resident View
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Select your area below to view planned distribution timings and current service announcements.
        </p>
      </div>

      {/* Area Selector */}
      <section aria-labelledby="area-select-label" className="bg-white p-4 rounded-lg border border-slate-200">
        <label
          id="area-select-label"
          htmlFor="area-dropdown"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
        >
          Select Village Area
        </label>
        <select
          id="area-dropdown"
          value={selectedAreaId}
          onChange={(e) => setSelectedAreaId(e.target.value)}
          className="w-full sm:w-80 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
        >
          {db.areas.map((area: Area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </section>

      {/* Delay & Service Notices */}
      <section aria-labelledby="notices-section-title" className="space-y-3">
        <h2 id="notices-section-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span>Active Notices ({selectedArea?.name || 'Selected Area'})</span>
        </h2>

        {activeNotices.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
            No active notices for this area.
          </div>
        ) : (
          <div className="space-y-3">
            {activeNotices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-lg border ${
                  notice.areaId === ''
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {notice.areaId === '' ? 'Village-Wide Notice' : `Notice for ${selectedArea?.name}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {notice.isSample && <SampleBadge />}
                    <span className="text-[11px] text-slate-600">
                      {formatISODateTime(notice.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Render user text as plain text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {notice.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Planned Water Timings */}
      <section aria-labelledby="schedule-section-title" className="space-y-3">
        <h2 id="schedule-section-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-700" />
          <span>Planned Water Timings</span>
        </h2>

        {areaSchedules.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
            No timings set for this area yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {areaSchedules.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{entry.dayOfWeek}</span>
                  {entry.isSample && <SampleBadge />}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-teal-800">
                    {formatTime24to12(entry.startTime)}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({entry.startTime} 24h)
                  </span>
                </div>

                <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Planned Duration:</span>
                  <strong className="text-slate-800">{entry.durationMinutes} minutes</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Action Prompt to Report */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Experiencing a leak, low pressure, or no water during scheduled supply?</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/report')}
          className="w-full sm:w-auto px-4 py-2 rounded text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white transition focus:outline-hidden focus:ring-2 focus:ring-amber-600"
        >
          Submit Issue Report
        </button>
      </div>
    </div>
  );
};
