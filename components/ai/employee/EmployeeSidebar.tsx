/**
 * Left navigation for employee routes with active-path highlighting.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  Clock3,
  Home,
  MapPinned,
  Route,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", description: "Daily briefing", icon: Home },
  {
    href: "/my-dispatches",
    label: "My Dispatches",
    description: "Assigned service calls",
    icon: MapPinned,
  },
  {
    href: "/my-tasks",
    label: "My Tasks",
    description: "To-do and follow-ups",
    icon: CheckSquare,
  },
  { href: "/time", label: "Time", description: "Entry and logs", icon: Clock3 },
  {
    href: "/schedule",
    label: "Schedule",
    description: "Upcoming work",
    icon: CalendarDays,
  },
  {
    href: "/workflows",
    label: "Workflows",
    description: "How-to guidance",
    icon: Route,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            Team 3
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            My Workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your daily service work, schedule, and guided next steps.
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "border-emerald-200 bg-emerald-50 shadow-sm"
                    : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-xl p-2 ${
                      active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        active ? "text-emerald-900" : "text-slate-900"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
