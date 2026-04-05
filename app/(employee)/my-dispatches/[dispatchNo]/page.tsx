/**
 * Dispatch detail view with AI email assistant for a single dispatch number.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployeeEmailAssistant } from "@/components/ai/employee/EmployeeEmailAssistant";
import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import {
  CURRENT_EMPLOYEE,
  getEmployeeDispatchDetail,
} from "@/lib/employeeHome";

type DispatchDetailPageProps = {
  params: Promise<{
    dispatchNo: string;
  }>;
};

function toneForStatus(status: string) {
  if (status.toUpperCase() === "CLOSED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function toneForPriority(priority: string) {
  if (priority === "1" || priority.toUpperCase() === "HIGH") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (priority === "2" || priority.toUpperCase() === "MEDIUM") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export default async function DispatchDetailPage({
  params,
}: DispatchDetailPageProps) {
  const { dispatchNo } = await params;
  const detail = await getEmployeeDispatchDetail(dispatchNo, CURRENT_EMPLOYEE);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <EmployeeHeader
        title={`Dispatch ${detail.dispatchno}`}
        description="Review the service context, contact details, work summary, and next communication steps from a technician-focused dispatch view."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/my-dispatches"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Back to My Dispatches
            </Link>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneForStatus(detail.status)}`}
            >
              {detail.status}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneForPriority(detail.priority)}`}
            >
              Priority {detail.priority}
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Service Context
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {detail.customerName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {detail.siteName} · {detail.siteAddress}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Call Number
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.callno}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Technician
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.technician}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Opened
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.openedOn}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Closed
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.closedOn}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Problem Description
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {detail.problem}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Notes and Summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {detail.workSummary}
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Logged Solution
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {detail.solution}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Equipment / Machine Context
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {detail.machineContext}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Caller Info
                </p>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Name
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.callerName}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Email
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.callerEmail}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Phone
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {detail.callerPhone}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Time Entries
                </p>
                <div className="mt-4 space-y-3">
                  {detail.timeEntries.map((entry) => (
                    <div
                      key={`${entry.label}-${entry.value}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {entry.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Team 2 AI Integration Slot
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Smart Reply is still pending
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  The current workspace exposes Team 2 email generation, but it
                  does not yet expose a shared Smart Reply surface for Part 3 to
                  consume safely.
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-600">
                    Smart Reply remains blocked until a confirmed shared Team 2
                    route or component is available in this repo.
                  </div>
                </div>
              </section>

              <EmployeeEmailAssistant dispatchNo={detail.dispatchno} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
