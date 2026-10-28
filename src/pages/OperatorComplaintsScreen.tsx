/**
 * @file OperatorComplaintsScreen.tsx
 * Screen S-06: /operator/complaints (Operator)
 * FR-005: Operator tracks a complaint through statuses until resolved.
 * Supports bidirectional transitions ('New' <-> 'In progress' <-> 'Resolved') [Proposed].
 * Empty text: "No complaints yet."
 */

import React, { useState, useMemo } from 'react';
import { AppDatabase, ComplaintStatus } from '../data/types.ts';
import { updateReportStatus } from '../data/storage.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { SampleBadge } from '../components/SampleBadge.tsx';
import { formatISODateTime } from '../lib/dateUtils.ts';
import { ClipboardList, Filter } from 'lucide-react';
import { GlassButton } from '../components/GlassButton.tsx';

interface OperatorComplaintsScreenProps {
  db: AppDatabase;
}

export const OperatorComplaintsScreen: React.FC<OperatorComplaintsScreenProps> = ({ db }) => {
  const [filterAreaId, setFilterAreaId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  const filteredReports = useMemo(() => {
    return db.reports.filter((r) => {
      const matchArea = filterAreaId === 'all' || r.areaId === filterAreaId;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchArea && matchStatus;
    });
  }, [db.reports, filterAreaId, filterStatus]);

  const handleStatusChange = (reportId: string, newStatus: ComplaintStatus) => {
    const res = updateReportStatus(reportId, newStatus);
    if (res.success) {
      setFeedbackMessage(`Status updated to "${newStatus}"`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-700" />
            <span>Complaint Tracking & Resolution</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Operator View
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Review community-reported water issues and advance or revise their status.
          Status transitions are bidirectional (Proposed) to allow reopening or corrections.
        </p>
      </div>

      {/* Temporary feedback banner */}
      {feedbackMessage && (
        <div
          role="status"
          className="p-3 bg-teal-50 border border-teal-300 rounded text-xs font-semibold text-teal-900"
        >
          {feedbackMessage}
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Area filter */}
          <div>
            <label htmlFor="comp-filter-area" className="sr-only">Filter by Area</label>
            <select
              id="comp-filter-area"
              value={filterAreaId}
              onChange={(e) => setFilterAreaId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            >
              <option value="all">All Areas</option>
              {db.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="comp-filter-status" className="sr-only">Filter by Status</label>
            <select
              id="comp-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In progress">In progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          No complaints yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">
                    {getAreaName(report.areaId)}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {formatReportType(report.type)}
                  </span>
                  {report.isSample && <SampleBadge />}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={report.status} />
                </div>
              </div>

              {/* Note (rendered strictly as plain text) */}
              {report.note ? (
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap break-words">
                  <span className="font-semibold text-slate-900 block mb-0.5">Report Details:</span>
                  {report.note}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No additional note provided.</div>
              )}

              {/* Status Update Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  <div>Reported: {formatISODateTime(report.createdAt)}</div>
                  <div>Updated: {formatISODateTime(report.updatedAt)}</div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 mr-1">Set Status:</span>
                  {(['New', 'In progress', 'Resolved'] as ComplaintStatus[]).map((st) => (
                    <GlassButton
                      key={st}
                      type="button"
                      disabled={report.status === st}
                      onClick={() => handleStatusChange(report.id, st)}
                      tone={report.status === st ? 'dark' : 'neutral'} className={`px-2.5 py-1 text-xs ${report.status === st ? 'font-bold' : ''}`}
                    >
                      {st}
                    </GlassButton>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
