/**
 * Employee tasks page backed by mock/API task data for the signed-in demo user.
 */
import { TaskList } from "@/components/ai/employee/TaskList";
import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import {
  CURRENT_EMPLOYEE,
  getEmployeeTasksPageData,
} from "@/lib/employeeHome";

export default async function MyTasksPage() {
  const data = await getEmployeeTasksPageData(CURRENT_EMPLOYEE);

  return (
    <>
      <EmployeeHeader
        title="My Tasks"
        description="Keep up with your to-do list, upcoming follow-ups, and task priorities in a simpler employee-focused workspace."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Open Tasks
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {data.openCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Work still waiting in {data.currentUser}&apos;s queue.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Completed
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {data.completedCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tasks already closed out for the day.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                High Priority
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {data.highPriorityCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Items that need attention before routine follow-ups.
              </p>
            </div>
          </div>

          <TaskList tasks={data.tasks} />
        </div>
      </section>
    </>
  );
}
