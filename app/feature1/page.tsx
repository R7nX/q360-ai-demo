import Link from "next/link";

import { getBusinessOverview } from "@/lib/q360/business-read";

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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}

function formatValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "--";
}

function formatNamedReference(
  primaryValue: string | null | undefined,
  referenceValue: string | null | undefined,
): string {
  const primary = primaryValue?.trim();
  const reference = referenceValue?.trim();

  if (primary && reference) {
    return `${primary} (${reference})`;
  }

  return primary ?? reference ?? "--";
}

function toProgressWidth(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getToneClasses(tone: "amber" | "blue" | "emerald" | "rose" | "slate") {
  switch (tone) {
    case "amber":
      return {
        accent: "bg-amber-500",
        pill: "border-amber-200 bg-amber-50 text-amber-800",
        surface: "border-amber-200 bg-amber-50",
        text: "text-amber-900",
      };
    case "blue":
      return {
        accent: "bg-blue-500",
        pill: "border-blue-200 bg-blue-50 text-blue-800",
        surface: "border-blue-200 bg-blue-50",
        text: "text-blue-900",
      };
    case "emerald":
      return {
        accent: "bg-emerald-500",
        pill: "border-emerald-200 bg-emerald-50 text-emerald-800",
        surface: "border-emerald-200 bg-emerald-50",
        text: "text-emerald-900",
      };
    case "rose":
      return {
        accent: "bg-rose-500",
        pill: "border-rose-200 bg-rose-50 text-rose-800",
        surface: "border-rose-200 bg-rose-50",
        text: "text-rose-900",
      };
    case "slate":
      return {
        accent: "bg-slate-500",
        pill: "border-slate-200 bg-slate-50 text-slate-700",
        surface: "border-slate-200 bg-slate-50",
        text: "text-slate-900",
      };
  }
}

function HighlightChip({
  label,
  tone = "slate",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "emerald" | "rose" | "slate";
  value: string;
}) {
  const classes = getToneClasses(tone);

  return (
    <div className={`min-w-0 rounded-2xl border px-3 py-3 ${classes.pill}`}>
      <div className="break-words text-[10px] font-semibold uppercase tracking-[0.14em] leading-snug opacity-80">
        {label}
      </div>
      <div className={`mt-1 break-words text-sm font-semibold leading-snug ${classes.text}`}>
        {value}
      </div>
    </div>
  );
}

function HighlightMetric({
  label,
  note,
  tone = "slate",
  value,
}: {
  label: string;
  note?: string;
  tone?: "amber" | "blue" | "emerald" | "rose" | "slate";
  value: string;
}) {
  const classes = getToneClasses(tone);

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border p-4 ${classes.surface}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${classes.accent}`} />
        <div className="break-words text-[11px] font-semibold uppercase tracking-[0.12em] leading-snug text-slate-500">
          {label}
        </div>
      </div>
      <div
        className={`mt-3 break-normal text-[clamp(1rem,1.3vw,1.375rem)] font-bold leading-[1.1] tracking-tight ${classes.text}`}
      >
        {value}
      </div>
      {note ? <div className="mt-1 break-words text-xs leading-5 text-slate-600">{note}</div> : null}
    </div>
  );
}

function ProgressHighlight({
  label,
  note,
  tone = "emerald",
  value,
}: {
  label: string;
  note?: string;
  tone?: "amber" | "blue" | "emerald" | "rose" | "slate";
  value: number | null | undefined;
}) {
  const classes = getToneClasses(tone);
  const width = toProgressWidth(value);

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border p-4 ${classes.surface}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="break-words text-[11px] font-semibold uppercase tracking-[0.12em] leading-snug text-slate-500">
            {label}
          </div>
          <div className={`mt-2 break-words text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight ${classes.text}`}>
            {formatPercent(value)}
          </div>
        </div>
        {note ? (
          <div className="max-w-none break-words text-left text-xs leading-5 text-slate-600 sm:max-w-[11rem] sm:text-right">
            {note}
          </div>
        ) : null}
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-white/80">
        <div
          className={`h-2.5 rounded-full ${classes.accent}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function DetailCell({
  label,
  tone = "slate",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "emerald" | "rose" | "slate";
  value: string;
}) {
  const classes = getToneClasses(tone);

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border p-3 ${classes.surface}`}>
      <div className="break-words text-[11px] font-semibold uppercase tracking-[0.12em] leading-snug text-slate-500">
        {label}
      </div>
      <div className={`mt-1 break-words text-sm font-semibold leading-snug ${classes.text}`}>
        {value}
      </div>
    </div>
  );
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

function isSeededDatabaseSource(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("postgres:"));
}

export default async function Feature1Page() {
  let overview;

  try {
    overview = await getBusinessOverview({
      agendaLimit: 4,
      activityLimit: 4,
      billingLimit: 4,
      projectLimit: 9,
      recommendationLimit: 4,
      taskLimit: 9,
    });
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

  const usingSeededDatabase =
    isSeededDatabaseSource(overview.dataSources.projects) ||
    isSeededDatabaseSource(overview.dataSources.tasks);

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
                  {usingSeededDatabase
                    ? "Project visibility, backed by PostgreSQL."
                    : "Project visibility, backed by live-safe Q360 reads."}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  {usingSeededDatabase
                    ? "This Team 1 page now prefers the configured PostgreSQL database in mock mode. It reads core project rows from seeded project tables and enriches them with snapshot and detail data when those tables are present."
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
                href="/api/feature1/snapshots"
              >
                Snapshots JSON
              </Link>
              <Link
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href="/api/feature1/details"
              >
                Details JSON
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
                Overdue commitments or margin pressure
              </div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                Snapshot revenue
              </div>
              <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {formatCurrency(overview.summary.snapshotRevenueTotal)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Source: {overview.dataSources.snapshots ?? "Unavailable"}
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Detail lines
              </div>
              <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {formatNumber(overview.summary.detailLineCount)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Refreshed {formatTimestamp(overview.generatedAt)}
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
                Project master context from `PROJECTS`, enriched with `LDVIEW_PROJECT`,
                `LDVIEW_PROJECTSNAPSHOT`, and `LDVIEW_PROJECTDETAIL`.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {overview.projectProgress.projects.length} shown
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {overview.projectProgress.projects.map((project) => {
              const status = getProjectStatus(project);

              return (
                <article
                  className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={project.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Project no {project.id}
                      </div>
                      <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-slate-900">
                        {project.title ?? "Untitled project"}
                      </h3>
                    </div>
                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
                    >
                      {status.label}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <HighlightChip
                      label="Customer"
                      tone="blue"
                      value={formatNamedReference(project.customerName, project.customerId)}
                    />
                    <HighlightChip
                      label="Site"
                      tone="slate"
                      value={formatNamedReference(project.siteName, project.siteId)}
                    />
                    <HighlightChip
                      label="Leader"
                      tone="emerald"
                      value={formatValue(project.ownerId)}
                    />
                    <HighlightChip
                      label="Sales rep"
                      tone="amber"
                      value={formatValue(project.salesRepId)}
                    />
                    <HighlightChip
                      label="Status"
                      tone={project.atRisk || project.overdueTaskCount > 0 ? "amber" : "emerald"}
                      value={formatValue(project.status)}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
                    <ProgressHighlight
                      label="Percent complete"
                      note={`Latest snapshot ${formatDate(project.latestSnapshotAt)} • End ${formatDate(project.endDate)}`}
                      tone={project.atRisk ? "amber" : "emerald"}
                      value={project.percentComplete}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <HighlightMetric
                        label="Revenue budget"
                        note="Commercial commitment"
                        tone="blue"
                        value={formatCurrency(project.revenueBudget)}
                      />
                      <HighlightMetric
                        label="Hours budget"
                        note="Planned effort"
                        tone="slate"
                        value={formatNumber(project.hoursBudget)}
                      />
                      <HighlightMetric
                        label="Snapshot margin"
                        note="Latest gross margin"
                        tone={
                          project.snapshotGrossMargin !== null && project.snapshotGrossMargin < 15
                            ? "amber"
                            : "emerald"
                        }
                        value={formatPercent(project.snapshotGrossMargin)}
                      />
                      <HighlightMetric
                        label="Snapshot profit"
                        note="Revenue minus snapshot cost"
                        tone={
                          project.snapshotGrossProfit !== null && project.snapshotGrossProfit < 0
                            ? "rose"
                            : "blue"
                        }
                        value={formatCurrency(project.snapshotGrossProfit)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <HighlightMetric
                      label="Open tasks"
                      note={
                        overview.followUps.warning
                          ? "Schedule table not available"
                          : "Current workload"
                      }
                      tone="slate"
                      value={formatNumber(project.openTaskCount)}
                    />
                    <HighlightMetric
                      label="Overdue tasks"
                      note="Needs attention"
                      tone={project.overdueTaskCount > 0 ? "rose" : "emerald"}
                      value={formatNumber(project.overdueTaskCount)}
                    />
                    <HighlightMetric
                      label="Detail lines"
                      note="Rows from LDVIEW_PROJECTDETAIL"
                      tone="slate"
                      value={formatNumber(project.detailLineCount)}
                    />
                    <HighlightMetric
                      label="Latest snapshot"
                      note="As-of date from LDVIEW_PROJECTSNAPSHOT"
                      tone={project.atRisk ? "amber" : "blue"}
                      value={formatDate(project.latestSnapshotAt)}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <DetailCell
                      label="Project start"
                      tone="blue"
                      value={formatDate(project.projectStartDate)}
                    />
                    <DetailCell
                      label="End date"
                      tone={project.atRisk ? "amber" : "blue"}
                      value={formatDate(project.endDate)}
                    />
                    <DetailCell
                      label="Detail cost"
                      tone="slate"
                      value={formatCurrency(project.detailExtendedCostTotal)}
                    />
                    <DetailCell
                      label="Detail value"
                      tone="blue"
                      value={formatCurrency(project.detailExtendedPriceTotal)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {overview.projectSnapshots ? (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Snapshot Rollups
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Latest financial rollups from `LDVIEW_PROJECTSNAPSHOT`.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {overview.projectSnapshots.snapshots.length} shown
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {overview.projectSnapshots.snapshots.map((snapshot) => (
                <article
                  className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={snapshot.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Snapshot {formatDate(snapshot.asOfDate)}
                      </div>
                      <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-slate-900">
                        {snapshot.projectTitle ?? snapshot.projectId}
                      </h3>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatValue(snapshot.status)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <HighlightChip
                      label="Customer"
                      tone="blue"
                      value={formatValue(snapshot.customerName)}
                    />
                    <HighlightChip
                      label="Leader"
                      tone="emerald"
                      value={formatValue(snapshot.ownerId)}
                    />
                    <HighlightChip
                      label="Hours"
                      tone="slate"
                      value={formatNumber(snapshot.hours)}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <HighlightMetric
                      label="Snapshot revenue"
                      note="Booked revenue in snapshot"
                      tone="blue"
                      value={formatCurrency(snapshot.revenue)}
                    />
                    <HighlightMetric
                      label="Snapshot cost"
                      note="Labor, material, misc, and sub"
                      tone="slate"
                      value={formatCurrency(snapshot.costTotal)}
                    />
                    <HighlightMetric
                      label="Gross profit"
                      note="Revenue minus cost"
                      tone={snapshot.grossProfit !== null && snapshot.grossProfit < 0 ? "rose" : "emerald"}
                      value={formatCurrency(snapshot.grossProfit)}
                    />
                    <HighlightMetric
                      label="Gross margin"
                      note="Latest rollup percentage"
                      tone={snapshot.grossMargin !== null && snapshot.grossMargin < 15 ? "amber" : "emerald"}
                      value={formatPercent(snapshot.grossMargin)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {overview.projectDetails ? (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Scope Detail
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Cost and pricing lines from `LDVIEW_PROJECTDETAIL`.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {overview.projectDetails.details.length} shown
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {overview.projectDetails.details.map((detail) => (
                <article
                  className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={detail.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {detail.projectId ?? "Unlinked detail"}
                      </div>
                      <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-slate-900">
                        {detail.description ?? "Untitled detail line"}
                      </h3>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatValue(detail.status)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <HighlightChip
                      label="Project"
                      tone="blue"
                      value={formatValue(detail.projectTitle ?? detail.projectId)}
                    />
                    <HighlightChip
                      label="Detail type"
                      tone="slate"
                      value={formatValue(detail.detailType)}
                    />
                    <HighlightChip
                      label="WBS"
                      tone="amber"
                      value={formatValue(detail.wbs)}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <HighlightMetric
                      label="Quantity"
                      note="Line quantity"
                      tone="slate"
                      value={formatNumber(detail.qty)}
                    />
                    <HighlightMetric
                      label="Unit cost"
                      note="Per-unit cost"
                      tone="blue"
                      value={formatCurrency(detail.cost)}
                    />
                    <HighlightMetric
                      label="Extended cost"
                      note="Rolled-up cost"
                      tone="slate"
                      value={formatCurrency(detail.extendedCost)}
                    />
                    <HighlightMetric
                      label="Extended price"
                      note="Rolled-up value"
                      tone="emerald"
                      value={formatCurrency(detail.extendedPrice)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h2>
              <p className="mt-1 text-sm text-slate-600">
                Work-plan context from `PROJECTSCHEDULE`, `LDVIEW_TASK`, or `TASKCONSOLEVIEW` when
                those tables are available.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {overview.followUps.tasks.length} shown
            </div>
          </div>

          {overview.followUps.tasks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Task source
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                No project schedule rows are loaded yet.
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {overview.followUps.warning ??
                  "Seed a project schedule table into DATABASE_URL to populate this section."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {overview.followUps.tasks.map((task) => {
                const status = getTaskStatus(task);

                return (
                  <article
                    className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Task no {task.id}
                        </div>
                        <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-slate-900">
                          {task.title ?? "Untitled task"}
                        </h3>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <HighlightChip
                        label="Project"
                        tone="blue"
                        value={formatNamedReference(task.projectTitle, task.projectId)}
                      />
                      <HighlightChip
                        label="Assignee"
                        tone="emerald"
                        value={formatValue(task.ownerId)}
                      />
                      <HighlightChip
                        label="Priority"
                        tone={
                          task.priority?.toUpperCase() === "HIGH"
                            ? "rose"
                            : task.priority?.toUpperCase() === "MEDIUM"
                              ? "amber"
                              : "slate"
                        }
                        value={formatValue(task.priority)}
                      />
                      <HighlightChip
                        label="WBS"
                        tone="slate"
                        value={formatValue(task.wbs ?? task.sequence)}
                      />
                      <HighlightChip
                        label="Status"
                        tone={task.isOverdue ? "rose" : task.isDueToday ? "amber" : "blue"}
                        value={formatValue(task.status)}
                      />
                    </div>

                    <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                      <ProgressHighlight
                        label="Task completion"
                        note={`Schedule ${formatDate(task.scheduleDate)} • End ${formatDate(task.endDate)}`}
                        tone={task.isOverdue ? "rose" : task.isDueToday ? "amber" : "emerald"}
                        value={task.taskPercentComplete}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <HighlightMetric
                          label="Project completion"
                          note="Linked project rollup"
                          tone="slate"
                          value={formatPercent(task.projectPercentComplete)}
                        />
                        <HighlightMetric
                          label="Effort"
                          note="Planned work from project schedule"
                          tone="blue"
                          value={formatNumber(task.effort)}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <DetailCell
                        label="Schedule date"
                        tone="blue"
                        value={formatDate(task.scheduleDate)}
                      />
                      <DetailCell
                        label="End date"
                        tone={task.isOverdue ? "rose" : task.isDueToday ? "amber" : "blue"}
                        value={formatDate(task.endDate)}
                      />
                      <DetailCell
                        label="Updated"
                        tone="slate"
                        value={formatTimestamp(task.updatedAt)}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Work note
                      </div>
                      <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                        {task.notesExcerpt ?? "No task note was returned by the source."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
