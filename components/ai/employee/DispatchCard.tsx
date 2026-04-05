import Link from "next/link";

type DispatchCardProps = {
  dispatchno: string;
  customerName: string;
  siteName: string;
  problem: string;
  priority: string;
  status: string;
  date: string;
};

function getPriorityTone(priority: string) {
  if (priority === "1" || priority.toUpperCase() === "HIGH") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (priority === "2" || priority.toUpperCase() === "MEDIUM") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getStatusTone(status: string) {
  if (status.toUpperCase() === "CLOSED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return "bg-blue-50 text-blue-700 border-blue-200";
}

export function DispatchCard({
  dispatchno,
  customerName,
  siteName,
  problem,
  priority,
  status,
  date,
}: DispatchCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Dispatch {dispatchno}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {customerName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{siteName}</p>
        </div>

        <div className="flex gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityTone(priority)}`}
          >
            Priority {priority}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(status)}`}
          >
            {status}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{problem}</p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Opened {date}
        </p>
        <Link
          href={`/my-dispatches/${dispatchno}`}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
