import type { EmployeeTask } from "@/lib/employeeHome";

type TaskListProps = {
  tasks: EmployeeTask[];
};

function getPriorityClasses(priority: EmployeeTask["priority"]) {
  if (priority === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (priority === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            My Tasks
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Today&apos;s follow-ups
          </h2>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Mock-safe list
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No tasks are currently loaded for this employee. The page stays usable
            even when task data is empty.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-2xl border px-4 py-4 ${
                task.completed
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                    task.completed
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        task.completed ? "text-slate-500 line-through" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    {task.dueLabel}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
