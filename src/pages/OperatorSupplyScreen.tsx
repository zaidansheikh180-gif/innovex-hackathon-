/**
 * @file OperatorSupplyScreen.tsx
 * Screen S-05: /operator/supply (Operator)
 * FR-004: Operator records each supply (area, date, start time, duration in whole minutes > 0).
 * Shows supply records at the top of area's history, with area filter and empty state.
 */

import React, { useState, useMemo } from 'react';
import { AppDatabase, Area } from '../data/types.ts';
import { addSupplyRecord } from '../data/storage.ts';
import { validateDurationMinutes, validateTime, validateDate } from '../lib/validation.ts';
import { formatTime24to12, formatISODateOnly, getTodayDateString, getCurrentTimeString } from '../lib/dateUtils.ts';
import { SampleBadge } from '../components/SampleBadge.tsx';
import { Droplets, PlusCircle, CheckCircle, Clock } from 'lucide-react';

interface OperatorSupplyScreenProps {
  db: AppDatabase;
}

export const OperatorSupplyScreen: React.FC<OperatorSupplyScreenProps> = ({ db }) => {
  // Form State
  const [areaId, setAreaId] = useState<string>(db.areas[0]?.id || 'area-1');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [startTime, setStartTime] = useState<string>(getCurrentTimeString());
  const [durationMinutes, setDurationMinutes] = useState<string>('60');

  // Form Status State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // List Filter State
  const [filterAreaId, setFilterAreaId] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    if (filterAreaId === 'all') {
      return db.supplyRecords;
    }
    return db.supplyRecords.filter((s) => s.areaId === filterAreaId);
  }, [db.supplyRecords, filterAreaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Anti-double submit

    const newErrors: Record<string, string> = {};

    // Validate area
    if (!areaId) {
      newErrors.areaId = 'Area is required.';
    }

    // Validate date
    const dateCheck = validateDate(date);
    if (!dateCheck.isValid) {
      newErrors.date = dateCheck.error || 'Date is invalid.';
    }

    // Validate time
    const timeCheck = validateTime(startTime);
    if (!timeCheck.isValid) {
      newErrors.startTime = timeCheck.error || 'Start time is invalid.';
    }

    // Validate duration: whole number > 0
    const durCheck = validateDurationMinutes(durationMinutes);
    if (!durCheck.isValid || durCheck.parsed === undefined) {
      newErrors.durationMinutes = durCheck.error || 'Duration must be a whole number greater than 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = addSupplyRecord({
        areaId,
        date,
        startTime,
        durationMinutes: durCheck.parsed!,
      });

      if (!result.success) {
        setErrors({ form: result.error || 'Failed to save supply record.' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Supply record added successfully.');
      setIsSubmitting(false);
    } catch (err: any) {
      setErrors({ form: err?.message || 'Error occurred while saving record.' });
      setIsSubmitting(false);
    }
  };

  const getAreaName = (id: string) => {
    const area = db.areas.find((a) => a.id === id);
    return area ? area.name : id;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-teal-700" />
            <span>Water Supply Log</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Operator View
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Record actual water distribution events per area. Each logged entry appears at the top of that area&apos;s history.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-emerald-950 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Add Supply Record Form */}
      <section aria-labelledby="add-supply-heading" className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <h2 id="add-supply-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-teal-700" />
          <span>Record New Water Distribution</span>
        </h2>

        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-semibold">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Area */}
            <div>
              <label htmlFor="supply-area" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Area <span className="text-rose-600">*</span>
              </label>
              <select
                id="supply-area"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                aria-describedby={errors.areaId ? 'supply-area-error' : undefined}
              >
                {db.areas.map((a: Area) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.areaId && (
                <p id="supply-area-error" className="mt-1 text-xs text-rose-600">
                  {errors.areaId}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="supply-date" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Distribution Date <span className="text-rose-600">*</span>
              </label>
              <input
                id="supply-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                aria-describedby={errors.date ? 'supply-date-error' : undefined}
              />
              {errors.date && (
                <p id="supply-date-error" className="mt-1 text-xs text-rose-600">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="supply-time" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Start Time (HH:MM 24h) <span className="text-rose-600">*</span>
              </label>
              <input
                id="supply-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                aria-describedby={errors.startTime ? 'supply-time-error' : undefined}
              />
              {errors.startTime && (
                <p id="supply-time-error" className="mt-1 text-xs text-rose-600">
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* Duration (Minutes) */}
            <div>
              <label htmlFor="supply-duration" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Duration (Whole Minutes &gt; 0) <span className="text-rose-600">*</span>
              </label>
              <input
                id="supply-duration"
                type="number"
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                aria-describedby={errors.durationMinutes ? 'supply-duration-error' : undefined}
              />
              {errors.durationMinutes && (
                <p id="supply-duration-error" className="mt-1 text-xs text-rose-600">
                  {errors.durationMinutes}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-sm text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition focus:outline-hidden focus:ring-2 focus:ring-teal-600"
          >
            {isSubmitting ? 'Saving Supply Record...' : 'Save Supply Record'}
          </button>
        </form>
      </section>

      {/* History List */}
      <section aria-labelledby="supply-history-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="supply-history-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span>Distribution History</span>
          </h2>

          {/* Area Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-area" className="text-xs font-semibold text-slate-600">
              Filter by Area:
            </label>
            <select
              id="filter-area"
              value={filterAreaId}
              onChange={(e) => setFilterAreaId(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            >
              <option value="all">All Areas ({db.supplyRecords.length})</option>
              {db.areas.map((a: Area) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
            No supply records yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {getAreaName(record.areaId)}
                    </span>
                    {record.isSample && <SampleBadge />}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>Date: <strong>{formatISODateOnly(record.date)}</strong></span>
                    <span>•</span>
                    <span>Start: <strong>{formatTime24to12(record.startTime)}</strong></span>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <div className="text-xs text-slate-500">Supplied For</div>
                  <div className="text-sm font-bold text-teal-800">
                    {record.durationMinutes} minutes
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
