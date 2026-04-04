import { parseQ360Date } from "@/lib/domain/dates";
import type { Activity, BillingSnapshot, Project, Task } from "@/lib/domain/models";
import {
  normalizeActivityRecord,
  normalizeBillingSnapshotRecord,
  normalizeProjectRecord,
  normalizeTaskRecord,
  resolveAvailableFields,
  type Q360RecordRow,
} from "@/lib/domain/normalizers";
import { listProjectRows, listTaskRows } from "@/lib/q360/list-actions";
import {
  listQ360Records,
  type RecordListFilter,
  type RecordListOrderBy,
} from "@/lib/q360/record-list";
import {
  buildActionCenter,
  type ActionCenterResponse,
} from "@/lib/rules/business-rules";

export type ProjectMonitorItem = Project & {
  atRisk: boolean;
  nextTaskDueDate: string | null;
  openTaskCount: number;
  overdueTaskCount: number;
  taskCount: number;
};

export type FollowUpItem = Task & {
  isDueToday: boolean;
  isOverdue: boolean;
  projectTitle: string | null;
  sequence: string | null;
};

export type ActivityStreamItem = Activity & {
  customerName: string | null;
  projectTitle: string | null;
};

export type BillingSummaryItem = BillingSnapshot & {
  customerName: string | null;
  projectTitle: string | null;
};

export type ProjectProgressResponse = {
  projects: ProjectMonitorItem[];
  sourceName: string;
  summary: {
    activeCount: number;
    atRiskCount: number;
    overdueCount: number;
    totalCount: number;
    withTaskBacklogCount: number;
  };
  taskSourceName: string;
};

export type FollowUpsResponse = {
  sourceName: string;
  summary: {
    dueTodayCount: number;
    linkedProjectCount: number;
    openCount: number;
    overdueTaskCount: number;
    totalCount: number;
  };
  tasks: FollowUpItem[];
};

export type ActivityStreamResponse = {
  activities: ActivityStreamItem[];
  sourceName: string;
  summary: {
    financeCount: number;
    handoffCount: number;
    linkedProjectCount: number;
    totalCount: number;
  };
};

export type BillingSummaryResponse = {
  entries: BillingSummaryItem[];
  sourceName: string;
  summary: {
    categoryCount: number;
    linkedProjectCount: number;
    totalCount: number;
    totalHoursBilled: number;
  };
};

export type BusinessOverviewResponse = {
  actionCenter: ActionCenterResponse;
  activityStream: ActivityStreamResponse | null;
  billingSummary: BillingSummaryResponse | null;
  dataSources: {
    activity: string | null;
    billing: string | null;
    projects: string;
    tasks: string;
  };
  followUps: FollowUpsResponse;
  generatedAt: string;
  projectProgress: ProjectProgressResponse;
  summary: {
    activeProjectCount: number;
    atRiskProjectCount: number;
    billedHoursTotal: number | null;
    dueTodayTaskCount: number;
    highPriorityActionCount: number;
    overdueProjectCount: number;
    overdueTaskCount: number;
    recentActivityCount: number | null;
    recommendationCount: number;
  };
  warnings: string[];
};

type ProjectLookupValue = {
  customerName: string | null;
  projectTitle: string | null;
};

type RecordSourcePlan<TItem> = {
  columns: string[];
  filters?: RecordListFilter[];
  normalize: (rows: Q360RecordRow[], sourceName: string) => TItem[];
  orderBy: RecordListOrderBy[];
  sourceName: string;
};

const CLOSED_STATUSES = new Set([
  "CANCELLED",
  "CLOSED",
  "COMPLETE",
  "COMPLETED",
  "DONE",
]);

const projectFieldCandidates = {
  customerId: ["customerno"],
  customerName: ["customer_company", "company"],
  dueDate: ["enddate", "duedate", "installdate"],
  hoursBudget: ["hoursbudget", "budgethours"],
  id: ["projectno"],
  lastActivityAt: ["moddate", "lastactivityat", "lastactivitydate"],
  ownerId: ["projectleader", "ownerid", "userid"],
  percentComplete: ["percentcomplete", "pctcomplete"],
  revenueBudget: ["revenuebudget", "budgetrevenue", "contractamount"],
  salesRepId: ["salesrep", "salesperson", "salesrepid"],
  siteId: ["siteno", "siteid"],
  startDate: ["startdate", "projectstartdate"],
  status: ["statuscode", "status"],
  title: ["title", "projecttitle"],
} as const;

const taskFieldCandidates = {
  dueDate: ["enddate", "duedate"],
  id: ["projectscheduleno", "taskno", "id"],
  notes: ["sched", "comment", "description", "notes"],
  ownerId: ["assignee", "ownerid", "userid"],
  projectId: ["projectno", "projects_projectno", "linkno"],
  projectTitle: ["projecttitle", "projects_title"],
  sequence: ["seq", "sequence", "wbs"],
  status: ["statuscode", "status"],
  title: ["title", "tasktitle"],
  updatedAt: ["moddate", "updatedat", "date"],
} as const;

const activityFieldCandidates = {
  id: ["projeventno", "globalscheduleno", "id"],
  occurredAt: ["date", "startdate", "moddate", "createdate"],
  ownerId: ["userid", "ownerid", "assignee"],
  projectId: ["projectno", "projects_projectno", "linkno"],
  summary: ["comment", "title", "description", "sched"],
  type: ["type", "linktype", "category", "statuscode"],
} as const;

const billingFieldCandidates = {
  amount: ["amount", "invamount", "lineamount"],
  billedAt: ["date", "moddate"],
  category: ["category", "wagetype", "type"],
  customerId: ["customerno"],
  description: ["description", "title"],
  dispatchId: ["dispatchno", "callno"],
  hoursBilled: ["timebilled", "totalhours", "hours"],
  id: ["timebillno", "projectno", "id"],
  projectId: ["projectno"],
  rate: ["rate"],
  userId: ["userid", "techassigned"],
} as const;

const activitySourcePlans: RecordSourcePlan<Activity>[] = [
  {
    columns: ["PROJEVENTNO", "PROJECTNO", "USERID", "DATE", "TYPE", "COMMENT"],
    normalize: normalizeActivityRows,
    orderBy: [{ dir: "desc", field: "DATE" }],
    sourceName: "PROJECTEVENTS",
  },
  {
    columns: [
      "GLOBALSCHEDULENO",
      "PROJECTS_PROJECTNO",
      "LINKNO",
      "LINKTYPE",
      "USERID",
      "STARTDATE",
      "STATUSCODE",
      "TITLE",
    ],
    filters: [{ field: "LINKTYPE", op: "like", value: "PROJECT%" }],
    normalize: normalizeActivityRows,
    orderBy: [{ dir: "desc", field: "STARTDATE" }],
    sourceName: "GLOBALSCHEDULE",
  },
];

const billingSourcePlans: RecordSourcePlan<BillingSnapshot>[] = [
  {
    columns: [
      "TIMEBILLNO",
      "PROJECTNO",
      "CUSTOMERNO",
      "DATE",
      "TIMEBILLED",
      "CATEGORY",
      "DESCRIPTION",
    ],
    normalize: normalizeBillingRows,
    orderBy: [{ dir: "desc", field: "DATE" }],
    sourceName: "TIMEBILL",
  },
  {
    columns: [
      "TIMEBILLNO",
      "PROJECTNO",
      "CUSTOMERNO",
      "DATE",
      "TIMEBILLED",
      "CATEGORY",
      "DESCRIPTION",
    ],
    normalize: normalizeBillingRows,
    orderBy: [{ dir: "desc", field: "DATE" }],
    sourceName: "LDView_TimeBillSummary",
  },
  {
    columns: ["PROJECTNO", "MODDATE", "TOTALHOURS"],
    normalize: normalizeBillingRows,
    orderBy: [{ dir: "desc", field: "MODDATE" }],
    sourceName: "LDView_ProjectHours",
  },
];

function collectAvailableFields(rows: Q360RecordRow[]): string[] {
  const availableFields = new Set<string>();

  for (const row of rows) {
    for (const fieldName of Object.keys(row)) {
      availableFields.add(fieldName);
    }
  }

  return Array.from(availableFields);
}

function readString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function isClosedStatus(status: string | null): boolean {
  return status ? CLOSED_STATUSES.has(status.toUpperCase()) : false;
}

function parseDate(value: string | null): Date | null {
  return parseQ360Date(value);
}

function isOverdue(dateValue: string | null, status: string | null): boolean {
  const parsedDate = parseDate(dateValue);
  if (!parsedDate || isClosedStatus(status)) {
    return false;
  }

  const deadline = new Date(parsedDate);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
}

function isDueToday(dateValue: string | null, status: string | null): boolean {
  const parsedDate = parseDate(dateValue);
  if (!parsedDate || isClosedStatus(status)) {
    return false;
  }

  const today = new Date();
  return (
    parsedDate.getFullYear() === today.getFullYear() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getDate() === today.getDate()
  );
}

function compareNullableDate(left: string | null, right: string | null): number {
  const leftTime = parseDate(left)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightTime = parseDate(right)?.getTime() ?? Number.POSITIVE_INFINITY;

  return leftTime - rightTime;
}

function normalizeProjectRows(rows: Q360RecordRow[], sourceName: string): Project[] {
  const fieldMap = resolveAvailableFields(
    collectAvailableFields(rows),
    projectFieldCandidates,
  );

  return rows
    .map((row) => normalizeProjectRecord(row, fieldMap, sourceName))
    .filter((project): project is Project => project !== null);
}

function normalizeTaskRows(rows: Q360RecordRow[], sourceName: string): FollowUpItem[] {
  const fieldMap = resolveAvailableFields(collectAvailableFields(rows), taskFieldCandidates);

  return rows
    .map((row) => {
      const task = normalizeTaskRecord(row, fieldMap, sourceName);
      if (!task) {
        return null;
      }

      return {
        ...task,
        isDueToday: isDueToday(task.dueDate, task.status),
        isOverdue: isOverdue(task.dueDate, task.status),
        projectTitle: readString(row.projecttitle ?? row.PROJECTTITLE),
        sequence: readString(row.seq ?? row.SEQ),
      } satisfies FollowUpItem;
    })
    .filter((task): task is FollowUpItem => task !== null);
}

function normalizeActivityRows(
  rows: Q360RecordRow[],
  sourceName: string,
): Activity[] {
  const fieldMap = resolveAvailableFields(
    collectAvailableFields(rows),
    activityFieldCandidates,
  );

  return rows
    .map((row) => normalizeActivityRecord(row, fieldMap, sourceName))
    .filter((activity): activity is Activity => activity !== null);
}

function normalizeBillingRows(
  rows: Q360RecordRow[],
  sourceName: string,
): BillingSnapshot[] {
  const fieldMap = resolveAvailableFields(
    collectAvailableFields(rows),
    billingFieldCandidates,
  );

  return rows
    .map((row) => normalizeBillingSnapshotRecord(row, fieldMap, sourceName))
    .filter((entry): entry is BillingSnapshot => entry !== null);
}

function sortTasks(tasks: FollowUpItem[]): FollowUpItem[] {
  return [...tasks].sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) {
      return left.isOverdue ? -1 : 1;
    }

    if (left.isDueToday !== right.isDueToday) {
      return left.isDueToday ? -1 : 1;
    }

    const dateComparison = compareNullableDate(left.dueDate, right.dueDate);
    if (dateComparison !== 0) {
      return dateComparison;
    }

    return String(left.title ?? left.id).localeCompare(String(right.title ?? right.id));
  });
}

function enrichProjects(projects: Project[], tasks: FollowUpItem[]): ProjectMonitorItem[] {
  const tasksByProject = new Map<string, FollowUpItem[]>();

  for (const task of tasks) {
    if (!task.projectId) {
      continue;
    }

    const taskGroup = tasksByProject.get(task.projectId) ?? [];
    taskGroup.push(task);
    tasksByProject.set(task.projectId, taskGroup);
  }

  return [...projects]
    .map((project) => {
      const linkedTasks = tasksByProject.get(project.id) ?? [];
      const openTasks = linkedTasks.filter((task) => !isClosedStatus(task.status));
      const overdueTaskCount = openTasks.filter((task) => task.isOverdue).length;
      const nextTaskDueDate =
        [...openTasks]
          .sort((left, right) => compareNullableDate(left.dueDate, right.dueDate))[0]
          ?.dueDate ?? null;
      const projectIsOverdue = isOverdue(project.dueDate, project.status);

      return {
        ...project,
        atRisk: projectIsOverdue || overdueTaskCount > 0,
        nextTaskDueDate,
        openTaskCount: openTasks.length,
        overdueTaskCount,
        taskCount: linkedTasks.length,
      } satisfies ProjectMonitorItem;
    })
    .sort((left, right) => {
      if (left.atRisk !== right.atRisk) {
        return left.atRisk ? -1 : 1;
      }

      const overdueComparison =
        Number(isOverdue(left.dueDate, left.status)) -
        Number(isOverdue(right.dueDate, right.status));
      if (overdueComparison !== 0) {
        return overdueComparison * -1;
      }

      const dateComparison = compareNullableDate(left.dueDate, right.dueDate);
      if (dateComparison !== 0) {
        return dateComparison;
      }

      return String(left.title ?? left.id).localeCompare(String(right.title ?? right.id));
    });
}

function buildProjectLookup(projects: Project[]): Map<string, ProjectLookupValue> {
  return new Map(
    projects.map((project) => [
      project.id,
      {
        customerName: project.customerName,
        projectTitle: project.title,
      },
    ]),
  );
}

function enrichActivities(
  activities: Activity[],
  projectLookup: Map<string, ProjectLookupValue>,
): ActivityStreamItem[] {
  return activities.map((activity) => {
    const projectContext = activity.projectId
      ? projectLookup.get(activity.projectId)
      : undefined;

    return {
      ...activity,
      customerName: projectContext?.customerName ?? null,
      projectTitle: projectContext?.projectTitle ?? null,
    };
  });
}

function enrichBillingEntries(
  entries: BillingSnapshot[],
  projectLookup: Map<string, ProjectLookupValue>,
): BillingSummaryItem[] {
  return entries.map((entry) => {
    const projectContext = entry.projectId ? projectLookup.get(entry.projectId) : undefined;

    return {
      ...entry,
      customerName: projectContext?.customerName ?? null,
      projectTitle: projectContext?.projectTitle ?? null,
    };
  });
}

async function getProjectLookup(): Promise<Map<string, ProjectLookupValue>> {
  const projectResult = await listProjectRows();
  const projects = normalizeProjectRows(projectResult.rows, projectResult.sourceName);
  return buildProjectLookup(projects);
}

async function readBusinessRecords<TItem>(
  plans: RecordSourcePlan<TItem>[],
  limit: number,
): Promise<{ items: TItem[]; sourceName: string }> {
  let firstError: unknown = null;
  const cappedLimit = Math.max(1, Math.min(limit, 25));

  for (const plan of plans) {
    try {
      const result = await listQ360Records(plan.sourceName, {
        columns: plan.columns,
        filters: plan.filters,
        limit: cappedLimit,
        offset: 0,
        orderBy: plan.orderBy,
      });

      return {
        items: plan.normalize(result.rows, result.sourceName),
        sourceName: result.sourceName,
      };
    } catch (error) {
      if (!firstError) {
        firstError = error;
      }
    }
  }

  throw firstError ?? new Error("No readable Q360 business source was found.");
}

async function loadOptionalSection<TSection>(
  label: string,
  loader: () => Promise<TSection>,
): Promise<{ data: TSection | null; warning: string | null }> {
  try {
    return {
      data: await loader(),
      warning: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return {
      data: null,
      warning: `${label} unavailable: ${message}`,
    };
  }
}

export async function getProjectProgress(limit = 12): Promise<ProjectProgressResponse> {
  const [projectResult, taskResult] = await Promise.all([listProjectRows(), listTaskRows()]);

  const projects = normalizeProjectRows(projectResult.rows, projectResult.sourceName);
  const tasks = normalizeTaskRows(taskResult.rows, taskResult.sourceName);
  const enrichedProjects = enrichProjects(projects, tasks);
  const limitedProjects = enrichedProjects.slice(0, Math.max(1, limit));

  return {
    projects: limitedProjects,
    sourceName: projectResult.sourceName,
    summary: {
      activeCount: enrichedProjects.filter((project) => !isClosedStatus(project.status)).length,
      atRiskCount: enrichedProjects.filter((project) => project.atRisk).length,
      overdueCount: enrichedProjects.filter((project) =>
        isOverdue(project.dueDate, project.status),
      ).length,
      totalCount: enrichedProjects.length,
      withTaskBacklogCount: enrichedProjects.filter((project) => project.openTaskCount > 0)
        .length,
    },
    taskSourceName: taskResult.sourceName,
  };
}

export async function getFollowUps(limit = 12): Promise<FollowUpsResponse> {
  const taskResult = await listTaskRows();
  const tasks = normalizeTaskRows(taskResult.rows, taskResult.sourceName);
  const openTasks = sortTasks(tasks.filter((task) => !isClosedStatus(task.status)));
  const limitedTasks = openTasks.slice(0, Math.max(1, limit));

  return {
    sourceName: taskResult.sourceName,
    summary: {
      dueTodayCount: openTasks.filter((task) => task.isDueToday).length,
      linkedProjectCount: new Set(
        openTasks
          .map((task) => task.projectId)
          .filter((projectId): projectId is string => Boolean(projectId)),
      ).size,
      openCount: openTasks.length,
      overdueTaskCount: openTasks.filter((task) => task.isOverdue).length,
      totalCount: openTasks.length,
    },
    tasks: limitedTasks,
  };
}

export async function getProjectActivityStream(
  limit = 12,
): Promise<ActivityStreamResponse> {
  const [{ items, sourceName }, projectLookup] = await Promise.all([
    readBusinessRecords(activitySourcePlans, limit),
    getProjectLookup(),
  ]);

  const activities = enrichActivities(items, projectLookup).sort(
    (left, right) => compareNullableDate(right.occurredAt, left.occurredAt),
  );

  return {
    activities,
    sourceName,
    summary: {
      financeCount: activities.filter((activity) =>
        (activity.type ?? "").toUpperCase().includes("FINANCE"),
      ).length,
      handoffCount: activities.filter((activity) =>
        (activity.type ?? "").toUpperCase().includes("HANDOFF"),
      ).length,
      linkedProjectCount: new Set(
        activities
          .map((activity) => activity.projectId)
          .filter((projectId): projectId is string => Boolean(projectId)),
      ).size,
      totalCount: activities.length,
    },
  };
}

export async function getBillingSummary(limit = 12): Promise<BillingSummaryResponse> {
  const [{ items, sourceName }, projectLookup] = await Promise.all([
    readBusinessRecords(billingSourcePlans, limit),
    getProjectLookup(),
  ]);

  const entries = enrichBillingEntries(items, projectLookup).sort(
    (left, right) => compareNullableDate(right.billedAt, left.billedAt),
  );
  const totalHoursBilled = Number(
    entries
      .reduce((total, entry) => total + (entry.hoursBilled ?? 0), 0)
      .toFixed(2),
  );

  return {
    entries,
    sourceName,
    summary: {
      categoryCount: new Set(
        entries
          .map((entry) => entry.category)
          .filter((category): category is string => Boolean(category)),
      ).size,
      linkedProjectCount: new Set(
        entries
          .map((entry) => entry.projectId)
          .filter((projectId): projectId is string => Boolean(projectId)),
      ).size,
      totalCount: entries.length,
      totalHoursBilled,
    },
  };
}

export async function getBusinessOverview(
  options: {
    agendaLimit?: number;
    activityLimit?: number;
    billingLimit?: number;
    projectLimit?: number;
    recommendationLimit?: number;
    taskLimit?: number;
  } = {},
): Promise<BusinessOverviewResponse> {
  const [projectProgress, followUps, activityStream, billingSummary] = await Promise.all([
    getProjectProgress(options.projectLimit ?? 8),
    getFollowUps(options.taskLimit ?? 8),
    loadOptionalSection("Project activity stream", () =>
      getProjectActivityStream(options.activityLimit ?? 8),
    ),
    loadOptionalSection("Billing summary", () =>
      getBillingSummary(options.billingLimit ?? 8),
    ),
  ]);

  const warnings = [activityStream.warning, billingSummary.warning].filter(
    (warning): warning is string => Boolean(warning),
  );
  const actionCenter = buildActionCenter(
    {
      activityStream: activityStream.data,
      billingSummary: billingSummary.data,
      followUps,
      projectProgress,
    },
    {
      agendaLimit: options.agendaLimit,
      recommendationLimit: options.recommendationLimit,
    },
  );

  return {
    actionCenter,
    activityStream: activityStream.data,
    billingSummary: billingSummary.data,
    dataSources: {
      activity: activityStream.data?.sourceName ?? null,
      billing: billingSummary.data?.sourceName ?? null,
      projects: projectProgress.sourceName,
      tasks: followUps.sourceName,
    },
    followUps,
    generatedAt: new Date().toISOString(),
    projectProgress,
    summary: {
      activeProjectCount: projectProgress.summary.activeCount,
      atRiskProjectCount: projectProgress.summary.atRiskCount,
      billedHoursTotal: billingSummary.data?.summary.totalHoursBilled ?? null,
      dueTodayTaskCount: followUps.summary.dueTodayCount,
      highPriorityActionCount: actionCenter.summary.highPriorityCount,
      overdueProjectCount: projectProgress.summary.overdueCount,
      overdueTaskCount: followUps.summary.overdueTaskCount,
      recentActivityCount: activityStream.data?.summary.totalCount ?? null,
      recommendationCount: actionCenter.summary.recommendationCount,
    },
    warnings,
  };
}
