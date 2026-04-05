import { Bell, CircleUserRound } from "lucide-react";

type EmployeeHeaderProps = {
  title: string;
  description: string;
};

export function EmployeeHeader({
  title,
  description,
}: EmployeeHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            Employee Workflow Hub
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
              <CircleUserRound className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Employee View
              </div>
              <div className="text-xs text-slate-500">
                Technician / CSR workspace
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
