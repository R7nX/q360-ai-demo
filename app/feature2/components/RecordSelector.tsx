"use client";

import { useEffect, useState } from "react";
import { ChevronDown, User, Calendar } from "lucide-react";
import type { RecordSummary } from "@/types/feature2";

interface RecordSelectorProps {
  selectedId: string | null;
  onSelect: (record: RecordSummary) => void;
}

export default function RecordSelector({
  selectedId,
  onSelect,
}: RecordSelectorProps) {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/feature2/records");
        if (!res.ok) throw new Error("Failed to fetch records");
        const data = await res.json();
        setRecords(data.records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load records");
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-11 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const selected = records.find((r) => r.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selectedId ?? ""}
          onChange={(e) => {
            const record = records.find((r) => r.id === e.target.value);
            if (record) onSelect(record);
          }}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="">Choose a dispatch record...</option>
          {records.map((r) => (
            <option key={r.id} value={r.id}>
              [{r.id}] {r.customerName} - {r.status}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {selected && (
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              {selected.customerName}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
                selected.status === "CLOSED"
                  ? "bg-emerald-100 text-emerald-700"
                  : selected.status === "OPEN"
                    ? "bg-amber-100 text-amber-700"
                    : selected.status === "IN PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {selected.status}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {selected.problem}
          </p>
          <div className="flex gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {selected.techAssigned}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {selected.date}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
