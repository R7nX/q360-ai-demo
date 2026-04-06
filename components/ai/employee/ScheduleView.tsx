import type { ScheduleEntry } from "@/lib/employeeHome";

type ScheduleViewProps = {
  weekRange: string;
  focusLabel: string;
  entries: ScheduleEntry[];
  confirmedStops: number;
  travelBlocks: number;
  holds: number;
};

function toneForStatus(status: ScheduleEntry["status"]) {
  if (status === "Confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Travel") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function ScheduleView({
  weekRange,
  focusLabel,
  entries,
  confirmedStops,
  travelBlocks,
  holds,
}: ScheduleViewProps) {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Schedule Overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {weekRange}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {focusLabel} designed for quick route planning, customer handoffs,
              and making sure the employee always knows the next stop.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Mock-backed schedule
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Confirmed Stops
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {confirmedStops}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Travel Blocks
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {travelBlocks}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Reserved Holds
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{holds}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Weekly Timeline
        </p>
        <div className="mt-5 grid gap-4">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No schedule items are available. The layout still stays readable when
              the employee has an empty week.
            </div>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[110px_160px_1fr]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {entry.day}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {entry.dateLabel}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {entry.start} - {entry.end}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneForStatus(entry.status)}`}
                  >
                    {entry.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {entry.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{entry.location}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {entry.note}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
