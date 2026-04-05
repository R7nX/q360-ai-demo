import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import { TimeEntry } from "@/components/ai/employee/TimeEntry";
import {
  CURRENT_EMPLOYEE,
  getEmployeeTimePageData,
} from "@/lib/employeeHome";

export default async function TimePage() {
  const data = await getEmployeeTimePageData(CURRENT_EMPLOYEE);

  return (
    <>
      <EmployeeHeader
        title="Time"
        description="Log billable work quickly, review recent entries, and keep your day moving without leaving the employee workspace."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Today
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {data.todayHours} hr
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Hours captured so far today.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                This Week
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {data.weekHours} hr
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Current weekly total for technician time tracking.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Logging Guidance
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Stage 4 keeps time entry demo-ready without requiring Team 2 AI.
                Later work can add smarter draft notes or richer persistence
                without changing this route shape.
              </p>
            </div>
          </div>

          <TimeEntry draft={data.draft} recentEntries={data.recentEntries} />
        </div>
      </section>
    </>
  );
}
