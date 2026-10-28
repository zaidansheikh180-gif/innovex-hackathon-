/**
 * @file OperatorCompareScreen.tsx
 * Screen S-08: /operator/compare (Operator / Panchayat)
 * FR-006: Panchayat compares supply and complaints across areas.
 * Modular, easy to add or remove.
 * Strictly respects honesty rules: only aggregates actual local records, no invented numbers.
 */

import React, { useMemo } from 'react';
import { AppDatabase } from '../data/types.ts';
import { BarChart2, Info, Droplets, AlertTriangle } from 'lucide-react';

interface OperatorCompareScreenProps {
  db: AppDatabase;
}

export const OperatorCompareScreen: React.FC<OperatorCompareScreenProps> = ({ db }) => {
  const comparisonData = useMemo(() => {
    return db.areas.map((area) => {
      // Supply stats
      const areaSupplies = db.supplyRecords.filter((s) => s.areaId === area.id);
      const totalSupplyEvents = areaSupplies.length;
      const totalSupplyMinutes = areaSupplies.reduce((acc, curr) => acc + curr.durationMinutes, 0);

      // Complaint stats
      const areaComplaints = db.reports.filter((r) => r.areaId === area.id);
      const totalComplaints = areaComplaints.length;
      const newComplaints = areaComplaints.filter((r) => r.status === 'New').length;
      const inProgressComplaints = areaComplaints.filter((r) => r.status === 'In progress').length;
      const resolvedComplaints = areaComplaints.filter((r) => r.status === 'Resolved').length;

      // Type breakdown
      const leaks = areaComplaints.filter((r) => r.type === 'leak').length;
      const noWater = areaComplaints.filter((r) => r.type === 'no_water').length;
      const lowSupply = areaComplaints.filter((r) => r.type === 'low_supply').length;

      return {
        areaId: area.id,
        areaName: area.name,
        totalSupplyEvents,
        totalSupplyMinutes,
        totalComplaints,
        newComplaints,
        inProgressComplaints,
        resolvedComplaints,
        leaks,
        noWater,
        lowSupply,
      };
    });
  }, [db.areas, db.supplyRecords, db.reports]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-700" />
            <span>Panchayat Area Comparison</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Operator View
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Compare recorded water distribution logs and reported community issues across village areas.
        </p>
      </div>

      {/* Honest aggregation notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Record-Based Count:</strong> Metrics represent exclusively the records entered into this
          device&apos;s browser database. The app does not invent volumetric liters,
          percentages, or household metrics.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Area Distribution & Complaint Summary
          </h2>
          <span className="text-xs text-slate-500">{db.areas.length} Areas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Village Area</th>
                <th className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Droplets className="w-3.5 h-3.5 text-teal-700" />
                    <span>Logged Supplies</span>
                  </div>
                </th>
                <th className="p-3 text-right">Total Duration</th>
                <th className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Complaints</span>
                  </div>
                </th>
                <th className="p-3">Status Breakdown</th>
                <th className="p-3">Type Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {comparisonData.map((row) => (
                <tr key={row.areaId} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 text-sm">{row.areaName}</td>
                  <td className="p-3 text-right font-semibold text-slate-800">
                    {row.totalSupplyEvents} {row.totalSupplyEvents === 1 ? 'event' : 'events'}
                  </td>
                  <td className="p-3 text-right font-bold text-teal-800">
                    {row.totalSupplyMinutes} minutes
                  </td>
                  <td className="p-3 text-right font-bold text-amber-900">
                    {row.totalComplaints}
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span>New: <strong>{row.newComplaints}</strong></span>
                      <span>In Progress: <strong>{row.inProgressComplaints}</strong></span>
                      <span>Resolved: <strong>{row.resolvedComplaints}</strong></span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span>Leaks: <strong>{row.leaks}</strong></span>
                      <span>No Water: <strong>{row.noWater}</strong></span>
                      <span>Low Pressure: <strong>{row.lowSupply}</strong></span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
