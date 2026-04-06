import type { OverdueSummary } from "@/types/feature2";

interface Props {
  summary: OverdueSummary;
}

export default function StatsSummaryBar({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-slate-800">{summary.totalScanned}</p>
        <p className="text-xs text-slate-500 mt-0.5">Dispatches Scanned</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-amber-700">{summary.totalOverdue}</p>
        <p className="text-xs text-amber-600 mt-0.5">Overdue</p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-red-700">{summary.critical}</p>
        <p className="text-xs text-red-600 mt-0.5">Critical</p>
      </div>
    </div>
  );
}
