/**
 * Morning-style briefing panel with summary bullets and dispatch/task counts.
 */
type DailyBriefingProps = {
  title: string;
  summary: string;
  points: string[];
  dispatchCount: number;
  taskCount: number;
};

export function DailyBriefing({
  title,
  summary,
  points,
  dispatchCount,
  taskCount,
}: DailyBriefingProps) {
  return (
    <section className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.98))] p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Daily Briefing
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{summary}</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[280px]">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Active Dispatches
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {dispatchCount}
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Open Tasks
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {taskCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {points.map((point) => (
          <div
            key={point}
            className="rounded-2xl border border-emerald-100 bg-white/75 px-4 py-3 text-sm text-slate-700"
          >
            {point}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
        Team 2 summarization is not exposed through a shared route in this
        workspace yet, so this briefing is currently assembled from local Part 3
        data.
      </div>
    </section>
  );
}
