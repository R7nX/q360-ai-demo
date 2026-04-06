import { DailyBriefing } from "@/components/ai/employee/DailyBriefing";
import { DispatchCard } from "@/components/ai/employee/DispatchCard";
import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import { TaskList } from "@/components/ai/employee/TaskList";
import { TimeEntry } from "@/components/ai/employee/TimeEntry";
import { getEmployeeHomeData } from "@/lib/employeeHome";
import Link from "next/link";

export default async function EmployeeHomePage() {
  const data = await getEmployeeHomeData();
  const openTaskCount = data.tasks.filter((task) => !task.completed).length;

  return (
    <>
      <EmployeeHeader
        title="Home"
        description="Start your day with a quick briefing, see assigned work, and move through the employee workflow from one place."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-6">
          <DailyBriefing
            title={data.briefingTitle}
            summary={data.briefingSummary}
            points={data.briefingPoints}
            dispatchCount={data.dispatches.length}
            taskCount={openTaskCount}
          />

          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-dispatches"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              Open My Dispatches
            </Link>
            <Link
              href="/my-tasks"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              View My Tasks
            </Link>
            <Link
              href="/time"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Log Time
            </Link>
            <Link
              href="/schedule"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              View Schedule
            </Link>
            <Link
              href="/workflows"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Open Workflows
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    My Dispatches Today
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Assigned service calls
                  </h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {data.currentUser}
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {data.dispatches.map((dispatch) => (
                  <DispatchCard key={dispatch.dispatchno} {...dispatch} />
                ))}
              </div>
            </section>

            <div className="grid gap-6">
              <TaskList tasks={data.tasks} />
              <TimeEntry
                draft={data.quickTimeEntry}
                recentEntries={data.recentTimeEntries}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
