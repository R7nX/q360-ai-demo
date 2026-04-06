"use client";

import { useState } from "react";

import type {
  QuickTimeEntryDraft,
  RecentTimeEntry,
} from "@/lib/employeeHome";

type TimeEntryProps = {
  draft: QuickTimeEntryDraft;
  recentEntries: RecentTimeEntry[];
};

export function TimeEntry({ draft, recentEntries }: TimeEntryProps) {
  const [dispatchno, setDispatchno] = useState(draft.dispatchno);
  const [category, setCategory] = useState(draft.category);
  const [duration, setDuration] = useState(draft.duration);
  const [note, setNote] = useState(draft.note);
  const [saved, setSaved] = useState(false);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Quick Time Entry
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Log work without leaving home
          </h2>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Demo-safe form
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Dispatch
            <input
              value={dispatchno}
              onChange={(event) => setDispatchno(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Duration (hours)
            <input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Work note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Save draft entry
          </button>
          {saved ? (
            <p className="text-sm text-emerald-700">
              Draft captured locally for the demo flow.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Stage 2 keeps this form interactive while later stages wire live time flows.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Recent entries
        </h3>
        <div className="mt-3 space-y-3">
          {recentEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No recent time entries are available yet. The quick-entry form still
              works for the demo path.
            </div>
          ) : (
            recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.when}</p>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {entry.duration}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
