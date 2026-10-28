/**
 * @file ResidentReportScreen.tsx
 * Screen S-03: /report (Resident)
 * Report form for leak, no water, or low supply (FR-003).
 * Enforces validation, field error placement, preserved valid input,
 * anti-double-submit lock, and privacy warning (no personal details).
 */

import React, { useState } from 'react';
import { Area, ReportType } from '../data/types.ts';
import { addReport } from '../data/storage.ts';
import { validateText } from '../lib/validation.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface ResidentReportScreenProps {
  areas: Area[];
  onNavigate: (path: string) => void;
}

export const ResidentReportScreen: React.FC<ResidentReportScreenProps> = ({
  areas,
  onNavigate,
}) => {
  const [areaId, setAreaId] = useState<string>(areas[0]?.id || 'area-1');
  const [reportType, setReportType] = useState<ReportType>('leak');
  const [note, setNote] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Anti-double submit guard

    const newErrors: Record<string, string> = {};

    // Validate area
    if (!areaId) {
      newErrors.areaId = 'Please select a village area.';
    }

    // Validate type
    if (!reportType) {
      newErrors.reportType = 'Please select an issue type.';
    }

    // Validate note if provided
    if (note.trim().length > 0) {
      const noteCheck = validateText(
        note,
        PLACEHOLDERS.textLimits.reportNote,
        false,
        'Note'
      );
      if (!noteCheck.isValid) {
        newErrors.note = noteCheck.error || 'Note is invalid.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = addReport({
        areaId,
        type: reportType,
        note: note.trim() || undefined,
      });

      if (!result.success) {
        setErrors({ form: result.error || 'Failed to save report to local storage.' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Report submitted successfully with status: New');
      setNote(''); // Clear note after success
      setIsSubmitting(false);
    } catch (err: any) {
      setErrors({ form: err?.message || 'Unexpected error while submitting report.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Report a Water Supply Issue</span>
        </h1>
        <p className="text-sm text-slate-600">
          Submit an interruption, pipe leak, or low-pressure report for your village area.
          Reports are saved with status <strong>New</strong> and are visible on this device and to the operator.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <GlassButton
            type="button"
            onClick={() => onNavigate('/my-reports')}
            tone="teal" className="text-xs font-bold px-3 py-1.5 flex items-center gap-1"
          >
            <span>View in My Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      )}

      {/* Privacy Warning Banner */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
        <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Notice:</strong> Do not enter personal details, names, phone numbers, or house numbers.
          Only describe the general physical issue or landmark in the area.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-5">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-semibold">
            {errors.form}
          </div>
        )}

        {/* Area Field */}
        <div>
          <label htmlFor="report-area" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Village Area <span className="text-rose-600">*</span>
          </label>
          <select
            id="report-area"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            aria-describedby={errors.areaId ? 'area-error' : undefined}
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {errors.areaId && (
            <p id="area-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.areaId}
            </p>
          )}
        </div>

        {/* Issue Type Field */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Issue Type <span className="text-rose-600">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'leak', label: 'Pipe / Standpost Leak' },
              { id: 'no_water', label: 'No Water Received' },
              { id: 'low_supply', label: 'Low Water Pressure' },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer text-xs font-semibold transition ${
                  reportType === option.id
                    ? 'border-teal-700 bg-teal-50/70 text-teal-950 ring-1 ring-teal-700'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={option.id}
                  checked={reportType === option.id}
                  onChange={() => setReportType(option.id as ReportType)}
                  className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-700"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.reportType && (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {errors.reportType}
            </p>
          )}
        </fieldset>

        {/* Note (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="report-note" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Additional Details (Optional)
            </label>
            <span className="text-[11px] text-slate-500">
              {note.length} / {PLACEHOLDERS.textLimits.reportNote} chars
            </span>
          </div>
          <textarea
            id="report-note"
            rows={3}
            value={note}
            maxLength={PLACEHOLDERS.textLimits.reportNote}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Near the main junction tap, water stopped after 10 minutes."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            aria-describedby={errors.note ? 'note-error' : undefined}
          />
          {errors.note && (
            <p id="note-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.note}
            </p>
          )}
        </div>

        {/* Submit Button with double-submit guard */}
        <div className="pt-2">
          <GlassButton
            type="submit"
            disabled={isSubmitting}
            tone="teal" className="px-6 py-2.5 font-semibold text-sm" wrapperClassName="flex w-full sm:w-auto sm:inline-flex"
          >
            {isSubmitting ? 'Saving Report...' : 'Submit Report'}
          </GlassButton>
        </div>
      </form>
    </div>
  );
};
