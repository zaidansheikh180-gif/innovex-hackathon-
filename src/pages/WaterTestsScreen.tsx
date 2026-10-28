/**
 * @file WaterTestsScreen.tsx
 * Screen S-09: /water-tests (Accessible to both Resident & Operator)
 * FR-007: Shows water-test results and safety notices entered from responsible authority.
 * Strict Honesty: The app never decides if water is safe.
 * Operator can add new test records with date and source.
 */

import React, { useState } from 'react';
import { AppDatabase, UserRole, Area } from '../data/types.ts';
import { addWaterTestResult } from '../data/storage.ts';
import { validateDate, validateText } from '../lib/validation.ts';
import { formatISODateOnly, formatISODateTime, getTodayDateString } from '../lib/dateUtils.ts';
import { PLACEHOLDERS } from '../config/placeholders.ts';
import { SampleBadge } from '../components/SampleBadge.tsx';
import { FlaskConical, ShieldAlert, PlusCircle, CheckCircle } from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface WaterTestsScreenProps {
  db: AppDatabase;
  currentRole: UserRole;
}

export const WaterTestsScreen: React.FC<WaterTestsScreenProps> = ({ db, currentRole }) => {
  // Form State (Operator only)
  const [testedOn, setTestedOn] = useState<string>(getTodayDateString());
  const [selectedAreaId, setSelectedAreaId] = useState<string>(''); // Optional
  const [resultText, setResultText] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    const dateCheck = validateDate(testedOn);
    if (!dateCheck.isValid) {
      newErrors.testedOn = dateCheck.error || 'Date is invalid.';
    }

    const resCheck = validateText(
      resultText,
      PLACEHOLDERS.textLimits.waterTestResult,
      true,
      'Test result details'
    );
    if (!resCheck.isValid) {
      newErrors.result = resCheck.error || 'Test result cannot be blank.';
    }

    const srcCheck = validateText(
      sourceText,
      PLACEHOLDERS.textLimits.waterTestSource,
      true,
      'Testing authority / source'
    );
    if (!srcCheck.isValid) {
      newErrors.source = srcCheck.error || 'Testing authority / source is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = addWaterTestResult({
        testedOn,
        areaId: selectedAreaId || undefined,
        result: resCheck.sanitized,
        source: srcCheck.sanitized,
      });

      if (!res.success) {
        setErrors({ form: res.error || 'Failed to save test record.' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Water testing record logged successfully.');
      setResultText('');
      setSourceText('');
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrors({ form: err?.message || 'Error occurred.' });
      setIsSubmitting(false);
    }
  };

  const getAreaName = (areaId?: string) => {
    if (!areaId) return 'Village-Wide / General Source';
    const a = db.areas.find((item) => item.id === areaId);
    return a ? a.name : areaId;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-700" />
            <span>Water Quality Test Records (FR-007)</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            {currentRole === 'operator' ? 'Operator View' : 'Resident View'}
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Official records and laboratory test notices received from authorized public health agencies.
        </p>
      </div>

      {/* Safety Notice Honesty Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-xs text-amber-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Official Testing Notice & Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          {PLACEHOLDERS.disclaimers.safetyNotice} This log reflects text entered from external testing
          authorities. Neither this software nor village panchayat staff automatically certifes drinking water
          potability.
        </p>
      </div>

      {/* Operator Add Test Form */}
      {currentRole === 'operator' && (
        <section aria-labelledby="add-test-heading" className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <h2 id="add-test-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-teal-700" />
            <span>Log External Water Quality Test Record</span>
          </h2>

          {successMessage && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs font-semibold text-emerald-950 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-semibold">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="test-date" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Testing Date <span className="text-rose-600">*</span>
                </label>
                <input
                  id="test-date"
                  type="date"
                  value={testedOn}
                  onChange={(e) => setTestedOn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
                {errors.testedOn && <p className="mt-1 text-xs text-rose-600">{errors.testedOn}</p>}
              </div>

              <div>
                <label htmlFor="test-area" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Specific Area (Optional)
                </label>
                <select
                  id="test-area"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                >
                  <option value="">Village-Wide / General Source</option>
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
                <label htmlFor="test-source" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Responsible Testing Authority / Source <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {sourceText.length} / {PLACEHOLDERS.textLimits.waterTestSource}
                </span>
              </div>
              <input
                id="test-source"
                type="text"
                value={sourceText}
                maxLength={PLACEHOLDERS.textLimits.waterTestSource}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="e.g. District Rural Water Testing Laboratory (Report Ref #)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
              {errors.source && <p className="mt-1 text-xs text-rose-600">{errors.source}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="test-result" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Result Statement as Provided <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {resultText.length} / {PLACEHOLDERS.textLimits.waterTestResult}
                </span>
              </div>
              <textarea
                id="test-result"
                rows={2}
                value={resultText}
                maxLength={PLACEHOLDERS.textLimits.waterTestResult}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="Transcribe the exact text from the testing authority report..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
              {errors.result && <p className="mt-1 text-xs text-rose-600">{errors.result}</p>}
            </div>

            <GlassButton
              type="submit"
              disabled={isSubmitting}
              tone="teal" className="px-5 py-2.5 font-semibold text-xs sm:text-sm"
            >
              {isSubmitting ? 'Saving Test Record...' : 'Log Test Record'}
            </GlassButton>
          </form>
        </section>
      )}

      {/* Test Records List */}
      <section aria-labelledby="test-records-list" className="space-y-3">
        <h2 id="test-records-list" className="text-base font-bold text-slate-900">
          Published Test Records ({db.waterTestResults.length})
        </h2>

        {db.waterTestResults.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
            No water test records entered yet.
          </div>
        ) : (
          <div className="space-y-3">
            {db.waterTestResults.map((t) => (
              <div
                key={t.id}
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Sample Tested: {formatISODateOnly(t.testedOn)}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-medium text-slate-700">
                      {getAreaName(t.areaId)}
                    </span>
                    {t.isSample && <SampleBadge />}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Logged: {formatISODateTime(t.enteredAt)}
                  </span>
                </div>

                <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap break-words">
                  <span className="font-bold text-slate-900 block mb-1">Reported Result:</span>
                  {t.result}
                </div>

                <div className="text-[11px] text-slate-600">
                  <strong>Source Authority:</strong> {t.source}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
