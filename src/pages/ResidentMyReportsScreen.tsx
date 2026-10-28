/**
 * @file ResidentMyReportsScreen.tsx
 * Screen S-04: /my-reports (Resident)
 * Shows reports submitted on this device with their active statuses (FR-005).
 * Empty text: "You have not made any reports on this device."
 */

import React from 'react';
import { AppDatabase } from '../data/types.ts';
import { getMyReportIds } from '../data/storage.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { SampleBadge } from '../components/SampleBadge.tsx';
import { formatISODateTime } from '../lib/dateUtils.ts';
import { ClipboardList, PlusCircle, AlertCircle } from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface ResidentMyReportsScreenProps {
  db: AppDatabase;
  onNavigate: (path: string) => void;
}

export const ResidentMyReportsScreen: React.FC<ResidentMyReportsScreenProps> = ({
  db,
  onNavigate,
}) => {
  const myReportIds = getMyReportIds();

  // Find reports matching myReportIds from local storage
  // If no user reports were submitted yet, we filter matching IDs (empty -> shows empty text)
  // If myReportIds has items, match them with current reports in db
  const myReports = db.reports.filter((r) => myReportIds.includes(r.id));

  const formatReportType = (type: string) => {
    switch (type) {
      case 'leak':
        return 'Pipe / Standpost Leak';
      case 'no_water':
        return 'No Water Received';
      case 'low_supply':
        return 'Low Water Pressure';
      default:
        return type;
    }
  };

  const getAreaName = (areaId: string) => {
    const area = db.areas.find((a) => a.id === areaId);
    return area ? area.name : areaId;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-700" />
            <span>My Submitted Reports</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tracks issue reports submitted from this specific browser and their resolution status.
          </p>
        </div>

        <GlassButton
          type="button"
          onClick={() => onNavigate('/report')}
          tone="teal" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </GlassButton>
      </div>

      {/* Reports List or Empty State */}
      {myReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            You have not made any reports on this device.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you submit a leak or water supply issue from the Report page, it will be listed here
            along with updates from the operator.
          </p>
          <GlassButton
            type="button"
            onClick={() => onNavigate('/report')}
            tone="teal" className="px-4 py-2 text-xs font-semibold"
          >
            Submit your first report
          </GlassButton>
        </div>
      ) : (
        <div className="space-y-3">
          {myReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {getAreaName(report.areaId)}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {formatReportType(report.type)}
                  </span>
                  {report.isSample && <SampleBadge />}
                </div>

                <StatusBadge status={report.status} />
              </div>

              {/* Note (rendered strictly as plain text) */}
              {report.note ? (
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap break-words">
                  <span className="font-semibold text-slate-900 block mb-0.5">Your Note:</span>
                  {report.note}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No additional note provided.</div>
              )}

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Submitted: {formatISODateTime(report.createdAt)}</span>
                <span>Last updated: {formatISODateTime(report.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
