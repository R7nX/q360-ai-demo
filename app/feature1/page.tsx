import Link from "next/link";

import { getBusinessOverview } from "@/lib/q360/adapter";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getProjectStatus(project: {
  atRisk: boolean;
  overdueTaskCount: number;
  status: string | null;
}): { label: string; tone: string } {
  if (project.overdueTaskCount > 0) {
    return {
      label: "Task risk",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (project.atRisk) {
    return {
      label: "At risk",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: project.status ?? "Active",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getTaskStatus(task: {
  isDueToday: boolean;
  isOverdue: boolean;
  status: string | null;
}): { label: string; tone: string } {
  if (task.isOverdue) {
    return {
      label: "Overdue",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (task.isDueToday) {
    return {
      label: "Due today",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: task.status ?? "Open",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function isMockDbSource(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("mock.db:"));
}

function isFixtureSource(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("fixtures:"));
}

export default async function Feature1Page() {
  try {
    const overview = await getBusinessOverview({
      agendaLimit: 4,
      activityLimit: 4,
      billingLimit: 4,
      projectLimit: 9,
      recommendationLimit: 4,
      taskLimit: 9,
    });
    const usingMockDb =
      isMockDbSource(overview.dataSources.projects) || isMockDbSource(overview.dataSources.tasks);
    const usingFixtureFallback =
      isFixtureSource(overview.dataSources.projects) || isFixtureSource(overview.dataSources.tasks);

    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Team 1 Manager Command Center
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    {usingMockDb
                      ? "Project and task visibility, backed by mock.db."
                      : usingFixtureFallback
                        ? "Project and task visibility, backed by bundled mock fixtures."
                        : "Project and task visibility, backed by live-safe Q360 reads."}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                    {usingMockDb
                      ? "This Team 1 page now prefers the local SQLite mock database in mock mode. Seed compatible project and task tables to drive the manager view, then add activity and billing tables for richer recommendations."
                      : usingFixtureFallback
                        ? "This Team 1 page is in fallback mock mode because mock.db does not yet have compatible Team 1 tables. Seed project and task tables to replace the bundled fixtures."
                        : "This first Team 1 page is centered on the confirmed project and task feeds. Service, sales, and accounting will be added in later stages once their live source strategy is locked."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href="/api/feature1/overview"
                >
                  Overview JSON
                </Link>
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  href="/api/feature1/projects"
                >
                  Projects JSON
                </Link>
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  href="/api/feature1/tasks"
                >
                  Tasks JSON
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Active projects
                </div>
                <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  {overview.summary.activeProjectCount}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {overview.projectProgress.summary.totalCount} projects loaded from{" "}
                  {overview.dataSources.projects}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  At risk
                </div>
                <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  {overview.summary.atRiskProjectCount}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Projects needing manager attention
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  Overdue tasks
                </div>
                <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  {overview.summary.overdueTaskCount}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Open tasks already past due
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Updated
                </div>
                <div className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                  {formatTimestamp(overview.generatedAt)}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Task source: {overview.dataSources.tasks}
                </div>
              </div>
            </div>

            {overview.warnings.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-sm font-semibold text-slate-900">Integration notes</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {overview.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Top project pressure from the current Team 1 live-safe sources.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {overview.projectProgress.projects.length} shown
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview.projectProgress.projects.map((project) => {
                const status = getProjectStatus(project);

                return (
                  <article
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    key={project.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                          {project.id}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold leading-tight text-slate-900">
                          {project.title ?? "Untitled project"}
                        </h3>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-4">
                        <span>Customer</span>
                        <span className="text-right font-medium text-slate-900">
                          {project.customerName ?? project.customerId ?? "--"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Owner</span>
                        <span className="text-right font-medium text-slate-900">
                          {project.ownerId ?? "--"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Due</span>
                        <span className="text-right font-medium text-slate-900">
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Open
                        </div>
                        <div className="mt-1 text-xl font-bold text-slate-900">
                          {project.openTaskCount}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                          Overdue
                        </div>
                        <div className="mt-1 text-xl font-bold text-slate-900">
                          {project.overdueTaskCount}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-blue-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                          Next task
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(project.nextTaskDueDate)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Overdue work first, then due-today commitments, then open follow-ups.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {overview.followUps.tasks.length} shown
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview.followUps.tasks.map((task) => {
                const status = getTaskStatus(task);

                return (
                  <article
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                          {task.id}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold leading-tight text-slate-900">
                          {task.title ?? "Untitled task"}
                        </h3>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-4">
                        <span>Project</span>
                        <span className="text-right font-medium text-slate-900">
                          {task.projectTitle ?? task.projectId ?? "--"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Assignee</span>
                        <span className="text-right font-medium text-slate-900">
                          {task.ownerId ?? "--"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Due</span>
                        <span className="text-right font-medium text-slate-900">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-5 line-clamp-4 text-sm leading-6 text-slate-600">
                      {task.notesExcerpt ?? "No task note was returned by the source."}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The Team 1 manager view could not load.";

    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Team 1 Manager Command Center
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              Feature 1 is not loading yet.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              The Team 1 page is wired into the copied backend foundation, but the current master
              branch still needs additional integration work before this route is stable.
            </p>
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {message}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="/"
              >
                Back to landing page
              </Link>
              <Link
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href="/api/feature1/overview"
              >
                Inspect Team 1 overview API
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
