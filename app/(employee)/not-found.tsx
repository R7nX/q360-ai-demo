import Link from "next/link";

import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";

export default function EmployeeNotFound() {
  return (
    <>
      <EmployeeHeader
        title="Page Not Found"
        description="This employee route is not available in the current demo flow. Use the links below to return to an active workspace page."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Employee Route Fallback
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            We couldn&apos;t find that page
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            The page may not be part of the current Team 3 demo flow, or the
            record you opened is no longer available in the current data source.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/home"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to Home
            </Link>
            <Link
              href="/my-dispatches"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Open My Dispatches
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
