import { DispatchCard } from "@/components/ai/employee/DispatchCard";
import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import {
  CURRENT_EMPLOYEE,
  getEmployeeDispatchSummaries,
} from "@/lib/employeeHome";

export default async function MyDispatchesPage() {
  const dispatches = await getEmployeeDispatchSummaries(CURRENT_EMPLOYEE);

  return (
    <>
      <EmployeeHeader
        title="My Dispatches"
        description="Review service calls assigned to you, move into details quickly, and prepare for the next customer stop."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Assigned Queue
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Dispatches for {CURRENT_EMPLOYEE}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This page keeps the technician queue focused on current service
                  work, status visibility, and quick access to the detail view.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {dispatches.length} visible dispatch{dispatches.length === 1 ? "" : "es"}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {dispatches.map((dispatch) => (
              <DispatchCard key={dispatch.dispatchno} {...dispatch} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
