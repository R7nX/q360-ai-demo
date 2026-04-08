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
  listAllQ360Records,
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
  detailExtendedCostTotal: number | null;
  detailExtendedPriceTotal: number | null;
  detailLineCount: number;
  latestSnapshotAt: string | null;
  nextTaskDueDate: string | null;
  openTaskCount: number;
  overdueTaskCount: number;
  siteName: string | null;
  snapshotCostTotal: number | null;
  snapshotGrossMargin: number | null;
  snapshotGrossProfit: number | null;
  snapshotRevenue: number | null;
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

export type ProjectSnapshotItem = {
  asOfDate: string | null;
  costTotal: number | null;
  customerName: string | null;
  grossMargin: number | null;
  grossProfit: number | null;
  hours: number | null;
  id: string;
  ownerId: string | null;
  projectId: string;
  projectTitle: string | null;
  revenue: number | null;
  sourceName: string;
  status: string | null;
};

export type ProjectDetailItem = {
  contractItemNo: string | null;
  cost: number | null;
  description: string | null;
  detailType: string | null;
  extendedCost: number | null;
  extendedPrice: number | null;
  id: string;
  itemType: string | null;
  projectId: string | null;
  projectTitle: string | null;
  qty: number | null;
  sourceName: string;
  stagingLocation: string | null;
  stagingDescription: string | null;
  status: string | null;
  wbs: string | null;
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
  warning: string | null;
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
  warning: string | null;
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

export type ProjectSnapshotsResponse = {
  snapshots: ProjectSnapshotItem[];
  sourceName: string;
  summary: {
    marginAlertCount: number;
    snapshotRevenueTotal: number | null;
    totalCount: number;
  };
};

export type ProjectDetailsResponse = {
  details: ProjectDetailItem[];
  sourceName: string;
  summary: {
    projectCount: number;
    totalCount: number;
    totalExtendedCost: number | null;
    totalExtendedPrice: number | null;
  };
};

export type BusinessOverviewResponse = {
  actionCenter: ActionCenterResponse;
  activityStream: ActivityStreamResponse | null;
  billingSummary: BillingSummaryResponse | null;
  dataSources: {
    activity: string | null;
    billing: string | null;
    detail: string | null;
    projects: string;
    snapshots: string | null;
    tasks: string;
  };
  followUps: FollowUpsResponse;
  generatedAt: string;
  projectDetails: ProjectDetailsResponse | null;
  projectProgress: ProjectProgressResponse;
  projectSnapshots: ProjectSnapshotsResponse | null;
  summary: {
    activeProjectCount: number;
    atRiskProjectCount: number;
    billedHoursTotal: number | null;
    detailLineCount: number | null;
    dueTodayTaskCount: number;
    highPriorityActionCount: number;
    overdueProjectCount: number;
    overdueTaskCount: number;
    recentActivityCount: number | null;
    recommendationCount: number;
    snapshotRevenueTotal: number | null;
  };
  warnings: string[];
};

type ProjectLookupValue = {
  customerName: string | null;
  projectTitle: string | null;
};

type ProjectDirectoryItem = {
  customerName: string | null;
  id: string;
  ownerId: string | null;
  projectStartDate: string | null;
  revenueBudget: number | null;
  salesRepId: string | null;
  siteName: string | null;
  status: string | null;
  title: string | null;
};

type ProjectDetailSummary = {
  extendedCostTotal: number | null;
  extendedPriceTotal: number | null;
  lineCount: number;
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
  customerName: ["customer_company", "company", "customername"],
  dueDate: ["enddate", "duedate", "installdate"],
  endDate: ["enddate", "duedate", "installdate"],
  hoursBudget: ["hoursbudget", "budgethours"],
  id: ["projectno"],
  lastActivityAt: ["moddate", "lastactivityat", "lastactivitydate", "projectforecastdate"],
  ownerId: ["projectleader", "ownerid", "userid"],
  percentComplete: ["percentcomplete", "pctcomplete"],
  projectStartDate: ["projectstartdate"],
  revenueBudget: ["revenuebudget", "budgetrevenue", "contractamount"],
  salesRepId: ["salesrep", "salesperson", "salesrepid"],
  siteId: ["siteno", "siteid"],
  startDate: ["startdate"],
  status: ["statuscode", "status"],
  title: ["title", "projecttitle", "nickname"],
} as const;

const taskFieldCandidates = {
  dueDate: ["enddate", "duedate"],
  effort: ["effort", "assignedeffort", "targeteffort", "totaleffort"],
  endDate: ["enddate", "duedate"],
  id: ["projectscheduleno", "taskno", "id"],
  notes: ["sched", "comment", "description", "notes"],
  ownerId: ["assignee", "ownerid", "userid"],
  priority: ["priority"],
  projectPercentComplete: ["projectpercentcomplete"],
  projectId: ["projectno", "projects_projectno", "linkno"],
  projectTitle: ["projecttitle", "projects_title"],
  scheduleDate: ["scheddate", "scheduledate"],
  sequence: ["seq", "sequence", "wbs"],
  status: ["statuscode", "status"],
  taskPercentComplete: ["taskpercentcomplete"],
  title: ["title", "tasktitle"],
  updatedAt: ["moddate", "updatedat", "date"],
  wbs: ["wbs"],
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

const projectDirectorySourcePlans: RecordSourcePlan<ProjectDirectoryItem>[] = [
  {
    columns: [
      "PROJECTNO",
      "TITLE",
      "COMPANY",
      "CUSTOMERNO",
      "STATUSCODE",
      "PROJECTLEADER",
      "PROJECTLEADERNAME",
      "SALESREP",
      "SALESREPNAME",
      "SITENAME",
      "PROJECTSTARTDATE",
      "REVENUEBUDGET",
    ],
    normalize: normalizeProjectDirectoryRows,
    orderBy: [{ dir: "asc", field: "PROJECTNO" }],
    sourceName: "LDVIEW_PROJECT",
  },
];

const projectSnapshotSourcePlans: RecordSourcePlan<ProjectSnapshotItem>[] = [
  {
    columns: [
      "ASOFDATE",
      "CUSTOMERNAME",
      "DGP",
      "PROJECTLEADER",
      "PROJECTNO",
      "SNAPSHOTHOURS",
      "SNAPSHOTLABCOST",
      "SNAPSHOTMATCOST",
      "SNAPSHOTMISCCOST",
      "SNAPSHOTREVENUE",
      "SNAPSHOTSUBCOST",
      "STATUSCODE",
      "TITLE",
    ],
    normalize: normalizeProjectSnapshotRows,
    orderBy: [
      { dir: "desc", field: "ASOFDATE" },
      { dir: "asc", field: "PROJECTNO" },
    ],
    sourceName: "LDVIEW_PROJECTSNAPSHOT",
  },
];

const projectDetailSourcePlans: RecordSourcePlan<ProjectDetailItem>[] = [
  {
    columns: [
      "CONITEMNO",
      "COST",
      "DESCRIPTION",
      "DETAILTYPE",
      "EXTENDEDCOST",
      "EXTENDEDPRICE",
      "ITEMTYPE",
      "PROJECTNO",
      "QTY",
      "STAGINGDESCRIPTION",
      "STAGINGLOCATION",
      "STATUSCODE",
      "WBS",
    ],
    normalize: normalizeProjectDetailRows,
    orderBy: [
      { dir: "asc", field: "PROJECTNO" },
      { dir: "asc", field: "WBS" },
      { dir: "asc", field: "DESCRIPTION" },
    ],
    sourceName: "LDVIEW_PROJECTDETAIL",
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

function getRowValue(row: Q360RecordRow, fieldName: string | undefined): unknown | null {
  if (!fieldName) {
    return null;
  }

  const directValue = row[fieldName];
  if (directValue !== undefined) {
    return directValue;
  }

  const lowerFieldName = fieldName.toLowerCase();
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase() === lowerFieldName) {
      return value;
    }
  }

  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundToTwo(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value.toFixed(2));
}

function sumNumbers(values: Array<number | null>): number | null {
  const numericValues = values.filter((value): value is number => value !== null);
  if (numericValues.length === 0) {
    return null;
  }

  return roundToTwo(numericValues.reduce((total, value) => total + value, 0));
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

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
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
      } satisfies FollowUpItem;
    })
    .filter((task): task is FollowUpItem => task !== null);
}

function normalizeActivityRows(rows: Q360RecordRow[], sourceName: string): Activity[] {
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

function normalizeProjectDirectoryRows(
  rows: Q360RecordRow[],
  _sourceName: string,
): ProjectDirectoryItem[] {
  return rows
    .map((row) => {
      const id = toStringOrNull(getRowValue(row, "PROJECTNO"));
      if (!id) {
        return null;
      }

      return {
        customerName:
          toStringOrNull(getRowValue(row, "COMPANY")) ??
          toStringOrNull(getRowValue(row, "CUSTOMERNAME")),
        id,
        ownerId:
          toStringOrNull(getRowValue(row, "PROJECTLEADER")) ??
          toStringOrNull(getRowValue(row, "PROJECTLEADERNAME")),
        projectStartDate: toStringOrNull(getRowValue(row, "PROJECTSTARTDATE")),
        revenueBudget: toNumberOrNull(getRowValue(row, "REVENUEBUDGET")),
        salesRepId:
          toStringOrNull(getRowValue(row, "SALESREP")) ??
          toStringOrNull(getRowValue(row, "SALESREPNAME")),
        siteName: toStringOrNull(getRowValue(row, "SITENAME")),
        status: toStringOrNull(getRowValue(row, "STATUSCODE")),
        title:
          toStringOrNull(getRowValue(row, "TITLE")) ??
          toStringOrNull(getRowValue(row, "NICKNAME")),
      } satisfies ProjectDirectoryItem;
    })
    .filter((item): item is ProjectDirectoryItem => item !== null);
}

function normalizeProjectSnapshotRows(
  rows: Q360RecordRow[],
  sourceName: string,
): ProjectSnapshotItem[] {
  return rows
    .map((row, index) => {
      const projectId = toStringOrNull(getRowValue(row, "PROJECTNO"));
      if (!projectId) {
        return null;
      }

      const asOfDate = toStringOrNull(getRowValue(row, "ASOFDATE"));
      const revenue = toNumberOrNull(getRowValue(row, "SNAPSHOTREVENUE"));
      const costTotal = sumNumbers([
        toNumberOrNull(getRowValue(row, "SNAPSHOTLABCOST")),
        toNumberOrNull(getRowValue(row, "SNAPSHOTMATCOST")),
        toNumberOrNull(getRowValue(row, "SNAPSHOTMISCCOST")),
        toNumberOrNull(getRowValue(row, "SNAPSHOTSUBCOST")),
      ]);
      const grossProfit =
        revenue !== null && costTotal !== null ? roundToTwo(revenue - costTotal) : null;
      const grossMargin =
        revenue !== null && revenue !== 0 && grossProfit !== null
          ? roundToTwo((grossProfit / revenue) * 100)
          : toNumberOrNull(getRowValue(row, "DGP"));

      return {
        asOfDate,
        costTotal,
        customerName: toStringOrNull(getRowValue(row, "CUSTOMERNAME")),
        grossMargin,
        grossProfit,
        hours: toNumberOrNull(getRowValue(row, "SNAPSHOTHOURS")),
        id: `${projectId}:${asOfDate ?? index}`,
        ownerId: toStringOrNull(getRowValue(row, "PROJECTLEADER")),
        projectId,
        projectTitle: toStringOrNull(getRowValue(row, "TITLE")),
        revenue,
        sourceName,
        status: toStringOrNull(getRowValue(row, "STATUSCODE")),
      } satisfies ProjectSnapshotItem;
    })
    .filter((item): item is ProjectSnapshotItem => item !== null);
}

function normalizeProjectDetailRows(
  rows: Q360RecordRow[],
  sourceName: string,
): ProjectDetailItem[] {
  const details: ProjectDetailItem[] = [];

  for (const [index, row] of rows.entries()) {
    const projectId = toStringOrNull(getRowValue(row, "PROJECTNO"));
    const description = toStringOrNull(getRowValue(row, "DESCRIPTION"));
    const lineRef =
      toStringOrNull(getRowValue(row, "CONITEMNO")) ??
      toStringOrNull(getRowValue(row, "WBS")) ??
      description ??
      String(index);

    if (!projectId && !description) {
      continue;
    }

    details.push({
      contractItemNo: toStringOrNull(getRowValue(row, "CONITEMNO")),
      cost: toNumberOrNull(getRowValue(row, "COST")),
      description,
      detailType: toStringOrNull(getRowValue(row, "DETAILTYPE")),
      extendedCost: toNumberOrNull(getRowValue(row, "EXTENDEDCOST")),
      extendedPrice: toNumberOrNull(getRowValue(row, "EXTENDEDPRICE")),
      id: `${projectId ?? "detail"}:${lineRef}`,
      itemType: toStringOrNull(getRowValue(row, "ITEMTYPE")),
      projectId,
      projectTitle: null,
      qty: toNumberOrNull(getRowValue(row, "QTY")),
      sourceName,
      stagingDescription: toStringOrNull(getRowValue(row, "STAGINGDESCRIPTION")),
      stagingLocation: toStringOrNull(getRowValue(row, "STAGINGLOCATION")),
      status: toStringOrNull(getRowValue(row, "STATUSCODE")),
      wbs: toStringOrNull(getRowValue(row, "WBS")),
    });
  }

  return details;
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

function buildProjectDirectoryMap(
  projectDirectoryItems: ProjectDirectoryItem[],
): Map<string, ProjectDirectoryItem> {
  return new Map(projectDirectoryItems.map((item) => [item.id, item]));
}

function buildProjectSnapshotMap(
  projectSnapshots: ProjectSnapshotItem[],
): Map<string, ProjectSnapshotItem> {
  const snapshotMap = new Map<string, ProjectSnapshotItem>();

  for (const snapshot of projectSnapshots) {
    const currentValue = snapshotMap.get(snapshot.projectId);
    if (
      !currentValue ||
      compareNullableDate(currentValue.asOfDate, snapshot.asOfDate) < 0
    ) {
      snapshotMap.set(snapshot.projectId, snapshot);
    }
  }

  return snapshotMap;
}

function buildProjectDetailSummaryMap(
  projectDetails: ProjectDetailItem[],
): Map<string, ProjectDetailSummary> {
  const detailSummaryMap = new Map<string, ProjectDetailSummary>();

  for (const detail of projectDetails) {
    if (!detail.projectId) {
      continue;
    }

    const currentValue = detailSummaryMap.get(detail.projectId) ?? {
      extendedCostTotal: null,
      extendedPriceTotal: null,
      lineCount: 0,
    };

    const nextExtendedCostTotal = sumNumbers([
      currentValue.extendedCostTotal,
      detail.extendedCost,
    ]);
    const nextExtendedPriceTotal = sumNumbers([
      currentValue.extendedPriceTotal,
      detail.extendedPrice,
    ]);

    detailSummaryMap.set(detail.projectId, {
      extendedCostTotal: nextExtendedCostTotal,
      extendedPriceTotal: nextExtendedPriceTotal,
      lineCount: currentValue.lineCount + 1,
    });
  }

  return detailSummaryMap;
}

function enrichProjects(
  projects: Project[],
  tasks: FollowUpItem[],
  projectDirectoryMap: Map<string, ProjectDirectoryItem>,
  projectSnapshotMap: Map<string, ProjectSnapshotItem>,
  projectDetailSummaryMap: Map<string, ProjectDetailSummary>,
): ProjectMonitorItem[] {
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
      const projectDirectory = projectDirectoryMap.get(project.id);
      const latestSnapshot = projectSnapshotMap.get(project.id);
      const detailSummary = projectDetailSummaryMap.get(project.id);
      const projectIsOverdue = isOverdue(project.dueDate ?? project.endDate, project.status);
      const snapshotMarginRisk =
        latestSnapshot?.grossProfit != null && latestSnapshot.grossProfit < 0;

      return {
        ...project,
        atRisk: projectIsOverdue || overdueTaskCount > 0 || snapshotMarginRisk,
        customerName: project.customerName ?? projectDirectory?.customerName ?? latestSnapshot?.customerName ?? null,
        detailExtendedCostTotal: detailSummary?.extendedCostTotal ?? null,
        detailExtendedPriceTotal: detailSummary?.extendedPriceTotal ?? null,
        detailLineCount: detailSummary?.lineCount ?? 0,
        lastActivityAt: project.lastActivityAt ?? latestSnapshot?.asOfDate ?? null,
        latestSnapshotAt: latestSnapshot?.asOfDate ?? null,
        nextTaskDueDate,
        openTaskCount: openTasks.length,
        overdueTaskCount,
        ownerId: project.ownerId ?? projectDirectory?.ownerId ?? latestSnapshot?.ownerId ?? null,
        projectStartDate: project.projectStartDate ?? projectDirectory?.projectStartDate ?? null,
        revenueBudget: project.revenueBudget ?? projectDirectory?.revenueBudget ?? null,
        salesRepId: project.salesRepId ?? projectDirectory?.salesRepId ?? null,
        siteName: projectDirectory?.siteName ?? null,
        snapshotCostTotal: latestSnapshot?.costTotal ?? null,
        snapshotGrossMargin: latestSnapshot?.grossMargin ?? null,
        snapshotGrossProfit: latestSnapshot?.grossProfit ?? null,
        snapshotRevenue: latestSnapshot?.revenue ?? null,
        status: project.status ?? projectDirectory?.status ?? latestSnapshot?.status ?? null,
        taskCount: linkedTasks.length,
        title: project.title ?? projectDirectory?.title ?? latestSnapshot?.projectTitle ?? null,
      } satisfies ProjectMonitorItem;
    })
    .sort((left, right) => {
      if (left.atRisk !== right.atRisk) {
        return left.atRisk ? -1 : 1;
      }

      const overdueComparison =
        Number(isOverdue(left.dueDate ?? left.endDate, left.status)) -
        Number(isOverdue(right.dueDate ?? right.endDate, right.status));
      if (overdueComparison !== 0) {
        return overdueComparison * -1;
      }

      const dateComparison = compareNullableDate(left.dueDate ?? left.endDate, right.dueDate ?? right.endDate);
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

function enrichProjectDetails(
  details: ProjectDetailItem[],
  projectLookup: Map<string, ProjectLookupValue>,
): ProjectDetailItem[] {
  return details.map((detail) => {
    const projectContext = detail.projectId ? projectLookup.get(detail.projectId) : undefined;

    return {
      ...detail,
      projectTitle: projectContext?.projectTitle ?? null,
    };
  });
}

async function getProjectLookup(): Promise<Map<string, ProjectLookupValue>> {
  const [projectResult, projectDirectoryLoad] = await Promise.all([
    listProjectRows(),
    tryReadAllBusinessRecords(projectDirectorySourcePlans, 250),
  ]);
  const projects = normalizeProjectRows(projectResult.rows, projectResult.sourceName);
  const enrichedProjects = enrichProjects(
    projects,
    [],
    buildProjectDirectoryMap(projectDirectoryLoad.items),
    new Map<string, ProjectSnapshotItem>(),
    new Map<string, ProjectDetailSummary>(),
  );

  return buildProjectLookup(enrichedProjects);
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

async function readAllBusinessRecords<TItem>(
  plans: RecordSourcePlan<TItem>[],
  maxRows: number,
): Promise<{ items: TItem[]; sourceName: string }> {
  let firstError: unknown = null;

  for (const plan of plans) {
    try {
      const result = await listAllQ360Records(plan.sourceName, {
        columns: plan.columns,
        filters: plan.filters,
        limit: 50,
        maxPages: Math.max(1, Math.ceil(maxRows / 50)),
        maxRows,
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

async function tryReadAllBusinessRecords<TItem>(
  plans: RecordSourcePlan<TItem>[],
  maxRows: number,
): Promise<{ items: TItem[]; sourceName: string | null; warning: string | null }> {
  try {
    const result = await readAllBusinessRecords(plans, maxRows);
    return {
      items: result.items,
      sourceName: result.sourceName,
      warning: null,
    };
  } catch (error) {
    return {
      items: [],
      sourceName: null,
      warning: formatErrorMessage(error),
    };
  }
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
    const message = formatErrorMessage(error);
    return {
      data: null,
      warning: `${label} unavailable: ${message}`,
    };
  }
}

async function loadTaskContext(): Promise<{
  sourceName: string;
  tasks: FollowUpItem[];
  warning: string | null;
}> {
  try {
    const taskResult = await listTaskRows();
    return {
      sourceName: taskResult.sourceName,
      tasks: normalizeTaskRows(taskResult.rows, taskResult.sourceName),
      warning: null,
    };
  } catch (error) {
    return {
      sourceName: "Unavailable",
      tasks: [],
      warning: `Project task data unavailable: ${formatErrorMessage(error)}`,
    };
  }
}

export async function getProjectProgress(limit = 12): Promise<ProjectProgressResponse> {
  const [projectResult, taskContext, projectDirectoryLoad, projectSnapshotLoad, projectDetailLoad] =
    await Promise.all([
      listProjectRows(),
      loadTaskContext(),
      tryReadAllBusinessRecords(projectDirectorySourcePlans, 250),
      tryReadAllBusinessRecords(projectSnapshotSourcePlans, 250),
      tryReadAllBusinessRecords(projectDetailSourcePlans, 250),
    ]);

  const projects = normalizeProjectRows(projectResult.rows, projectResult.sourceName);
  const enrichedProjects = enrichProjects(
    projects,
    taskContext.tasks,
    buildProjectDirectoryMap(projectDirectoryLoad.items),
    buildProjectSnapshotMap(projectSnapshotLoad.items),
    buildProjectDetailSummaryMap(projectDetailLoad.items),
  );
  const limitedProjects = enrichedProjects.slice(0, Math.max(1, limit));

  return {
    projects: limitedProjects,
    sourceName: projectResult.sourceName,
    summary: {
      activeCount: enrichedProjects.filter((project) => !isClosedStatus(project.status)).length,
      atRiskCount: enrichedProjects.filter((project) => project.atRisk).length,
      overdueCount: enrichedProjects.filter((project) =>
        isOverdue(project.dueDate ?? project.endDate, project.status),
      ).length,
      totalCount: enrichedProjects.length,
      withTaskBacklogCount: enrichedProjects.filter((project) => project.openTaskCount > 0)
        .length,
    },
    taskSourceName: taskContext.sourceName,
    warning: taskContext.warning,
  };
}

export async function getFollowUps(limit = 12): Promise<FollowUpsResponse> {
  const taskContext = await loadTaskContext();
  const openTasks = sortTasks(taskContext.tasks.filter((task) => !isClosedStatus(task.status)));
  const limitedTasks = openTasks.slice(0, Math.max(1, limit));

  return {
    sourceName: taskContext.sourceName,
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
    warning: taskContext.warning,
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

export async function getProjectSnapshots(
  limit = 12,
): Promise<ProjectSnapshotsResponse> {
  const { items, sourceName } = await readAllBusinessRecords(projectSnapshotSourcePlans, 250);
  const snapshots = [...items]
    .sort((left, right) => compareNullableDate(right.asOfDate, left.asOfDate))
    .slice(0, Math.max(1, limit));

  return {
    snapshots,
    sourceName,
    summary: {
      marginAlertCount: items.filter((snapshot) =>
        snapshot.grossMargin !== null ? snapshot.grossMargin < 15 : false,
      ).length,
      snapshotRevenueTotal: sumNumbers(items.map((snapshot) => snapshot.revenue)),
      totalCount: items.length,
    },
  };
}

export async function getProjectDetails(
  limit = 12,
): Promise<ProjectDetailsResponse> {
  const [{ items, sourceName }, projectLookup] = await Promise.all([
    readAllBusinessRecords(projectDetailSourcePlans, 250),
    getProjectLookup(),
  ]);
  const details = enrichProjectDetails(items, projectLookup).slice(0, Math.max(1, limit));

  return {
    details,
    sourceName,
    summary: {
      projectCount: new Set(
        items
          .map((detail) => detail.projectId)
          .filter((projectId): projectId is string => Boolean(projectId)),
      ).size,
      totalCount: items.length,
      totalExtendedCost: sumNumbers(items.map((detail) => detail.extendedCost)),
      totalExtendedPrice: sumNumbers(items.map((detail) => detail.extendedPrice)),
    },
  };
}

export async function getBusinessOverview(
  options: {
    agendaLimit?: number;
    activityLimit?: number;
    billingLimit?: number;
    detailLimit?: number;
    projectLimit?: number;
    recommendationLimit?: number;
    snapshotLimit?: number;
    taskLimit?: number;
  } = {},
): Promise<BusinessOverviewResponse> {
  const [
    projectProgress,
    followUps,
    activityStream,
    billingSummary,
    projectSnapshots,
    projectDetails,
  ] = await Promise.all([
    getProjectProgress(options.projectLimit ?? 8),
    getFollowUps(options.taskLimit ?? 8),
    loadOptionalSection("Project activity stream", () =>
      getProjectActivityStream(options.activityLimit ?? 8),
    ),
    loadOptionalSection("Billing summary", () =>
      getBillingSummary(options.billingLimit ?? 8),
    ),
    loadOptionalSection("Project snapshots", () =>
      getProjectSnapshots(options.snapshotLimit ?? 8),
    ),
    loadOptionalSection("Project detail lines", () =>
      getProjectDetails(options.detailLimit ?? 8),
    ),
  ]);

  const warnings = Array.from(
    new Set(
      [
        projectProgress.warning,
        followUps.warning,
        activityStream.warning,
        billingSummary.warning,
        projectSnapshots.warning,
        projectDetails.warning,
      ].filter((warning): warning is string => Boolean(warning)),
    ),
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
      detail: projectDetails.data?.sourceName ?? null,
      projects: projectProgress.sourceName,
      snapshots: projectSnapshots.data?.sourceName ?? null,
      tasks: followUps.sourceName,
    },
    followUps,
    generatedAt: new Date().toISOString(),
    projectDetails: projectDetails.data,
    projectProgress,
    projectSnapshots: projectSnapshots.data,
    summary: {
      activeProjectCount: projectProgress.summary.activeCount,
      atRiskProjectCount: projectProgress.summary.atRiskCount,
      billedHoursTotal: billingSummary.data?.summary.totalHoursBilled ?? null,
      detailLineCount: projectDetails.data?.summary.totalCount ?? null,
      dueTodayTaskCount: followUps.summary.dueTodayCount,
      highPriorityActionCount: actionCenter.summary.highPriorityCount,
      overdueProjectCount: projectProgress.summary.overdueCount,
      overdueTaskCount: followUps.summary.overdueTaskCount,
      recentActivityCount: activityStream.data?.summary.totalCount ?? null,
      recommendationCount: actionCenter.summary.recommendationCount,
      snapshotRevenueTotal: projectSnapshots.data?.summary.snapshotRevenueTotal ?? null,
    },
    warnings,
  };
}
