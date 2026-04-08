import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type MockPgTable = {
  rows: Record<string, unknown>[];
  schemaName?: string;
  tableName: string;
};

const mockPgTables = new Map<string, MockPgTable>();

function buildMockPgTableKey(tableName: string, schemaName = "public"): string {
  return `${schemaName}.${tableName}`.toUpperCase();
}

function setMockPgTables(tables: MockPgTable[]): void {
  mockPgTables.clear();

  for (const table of tables) {
    mockPgTables.set(
      buildMockPgTableKey(table.tableName, table.schemaName),
      {
        rows: table.rows.map((row) => ({ ...row })),
        schemaName: table.schemaName ?? "public",
        tableName: table.tableName,
      },
    );
  }
}

function seedFeature1PostgresTables(): void {
  setMockPgTables([
    {
      tableName: "projects",
      rows: [
        {
          CUSTOMERNO: "C10025",
          ENDDATE: "2026-03-28 00:00:00.000",
          HOURSBUDGET: "120",
          PERCENTCOMPLETE: "72",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          PROJECTSTARTDATE: "2026-02-03 00:00:00.000",
          PROJECTFORECASTDATE: "2026-03-20 14:15:00.000",
          REVENUEBUDGET: "85000",
          SALESREP: "JMILLER",
          SITENO: "S-1001",
          STARTDATE: "2026-02-10 00:00:00.000",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
        {
          CUSTOMERNO: "C10026",
          ENDDATE: "2026-03-18 00:00:00.000",
          HOURSBUDGET: "96",
          PERCENTCOMPLETE: "58",
          PROJECTLEADER: "RLEE",
          PROJECTNO: "P-1002",
          PROJECTSTARTDATE: "2026-01-15 00:00:00.000",
          PROJECTFORECASTDATE: "2026-03-01 09:00:00.000",
          REVENUEBUDGET: "64000",
          SALESREP: "RLEE",
          SITENO: "S-1002",
          STARTDATE: "2026-01-22 00:00:00.000",
          STATUSCODE: "ACTIVE",
          TITLE: "Clinic Exam Room Expansion",
        },
        {
          CUSTOMERNO: "C10027",
          ENDDATE: "2026-04-11 00:00:00.000",
          HOURSBUDGET: "140",
          PERCENTCOMPLETE: "22",
          PROJECTLEADER: "KADAMS",
          PROJECTNO: "P-1003",
          PROJECTSTARTDATE: "2026-02-25 00:00:00.000",
          PROJECTFORECASTDATE: "2026-03-22 16:40:00.000",
          REVENUEBUDGET: "132000",
          SALESREP: "KADAMS",
          SITENO: "S-1003",
          STARTDATE: "2026-03-02 00:00:00.000",
          STATUSCODE: "PLANNING",
          TITLE: "Council Chamber Modernization",
        },
      ],
    },
    {
      tableName: "ldview_project",
      rows: [
        {
          COMPANY: "North Peak University",
          CUSTOMERNO: "C10025",
          ENDDATE: "2026-03-28 00:00:00.000",
          PERCENTCOMPLETE: "72",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          REVENUEBUDGET: "85000",
          SALESREP: "JMILLER",
          SITENAME: "North Peak Main Campus",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
        {
          COMPANY: "Summit Health",
          CUSTOMERNO: "C10026",
          ENDDATE: "2026-03-18 00:00:00.000",
          PERCENTCOMPLETE: "58",
          PROJECTLEADER: "RLEE",
          PROJECTNO: "P-1002",
          REVENUEBUDGET: "64000",
          SALESREP: "RLEE",
          SITENAME: "Summit Clinic East",
          STATUSCODE: "ACTIVE",
          TITLE: "Clinic Exam Room Expansion",
        },
        {
          COMPANY: "City of Fairfield",
          CUSTOMERNO: "C10027",
          ENDDATE: "2026-04-11 00:00:00.000",
          PERCENTCOMPLETE: "22",
          PROJECTLEADER: "KADAMS",
          PROJECTNO: "P-1003",
          REVENUEBUDGET: "132000",
          SALESREP: "KADAMS",
          SITENAME: "Fairfield Council Chambers",
          STATUSCODE: "PLANNING",
          TITLE: "Council Chamber Modernization",
        },
      ],
    },
    {
      tableName: "ldview_projectsnapshot",
      rows: [
        {
          ASOFDATE: "2026-03-23 00:00:00.000",
          CUSTOMERNAME: "North Peak University",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          SNAPSHOTHOURS: "88",
          SNAPSHOTLABCOST: "18000",
          SNAPSHOTMATCOST: "24000",
          SNAPSHOTMISCCOST: "2000",
          SNAPSHOTREVENUE: "71000",
          SNAPSHOTSUBCOST: "7000",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
        {
          ASOFDATE: "2026-03-22 00:00:00.000",
          CUSTOMERNAME: "Summit Health",
          PROJECTLEADER: "RLEE",
          PROJECTNO: "P-1002",
          SNAPSHOTHOURS: "60",
          SNAPSHOTLABCOST: "28000",
          SNAPSHOTMATCOST: "25000",
          SNAPSHOTMISCCOST: "3000",
          SNAPSHOTREVENUE: "54000",
          SNAPSHOTSUBCOST: "6000",
          STATUSCODE: "ACTIVE",
          TITLE: "Clinic Exam Room Expansion",
        },
        {
          ASOFDATE: "2026-03-22 00:00:00.000",
          CUSTOMERNAME: "City of Fairfield",
          PROJECTLEADER: "KADAMS",
          PROJECTNO: "P-1003",
          SNAPSHOTHOURS: "24",
          SNAPSHOTLABCOST: "12000",
          SNAPSHOTMATCOST: "8000",
          SNAPSHOTMISCCOST: "1500",
          SNAPSHOTREVENUE: "41000",
          SNAPSHOTSUBCOST: "4000",
          STATUSCODE: "PLANNING",
          TITLE: "Council Chamber Modernization",
        },
      ],
    },
    {
      tableName: "ldview_projectdetail",
      rows: [
        {
          CONITEMNO: "CI-1001",
          COST: "1200",
          DESCRIPTION: "Display package",
          DETAILTYPE: "EQUIPMENT",
          EXTENDEDCOST: "2400",
          EXTENDEDPRICE: "3600",
          ITEMTYPE: "MATERIAL",
          PROJECTNO: "P-1001",
          QTY: "2",
          STAGINGLOCATION: "Warehouse A",
          STATUSCODE: "ACTIVE",
          WBS: "1.2.0",
        },
        {
          CONITEMNO: "CI-1002",
          COST: "950",
          DESCRIPTION: "Exam room audio package",
          DETAILTYPE: "EQUIPMENT",
          EXTENDEDCOST: "3800",
          EXTENDEDPRICE: "5200",
          ITEMTYPE: "MATERIAL",
          PROJECTNO: "P-1002",
          QTY: "4",
          STAGINGLOCATION: "Clinic staging",
          STATUSCODE: "ACTIVE",
          WBS: "2.1.0",
        },
        {
          CONITEMNO: "CI-1003",
          COST: "1800",
          DESCRIPTION: "Council chamber control system",
          DETAILTYPE: "SYSTEM",
          EXTENDEDCOST: "5400",
          EXTENDEDPRICE: "7600",
          ITEMTYPE: "MATERIAL",
          PROJECTNO: "P-1003",
          QTY: "3",
          STAGINGLOCATION: "Municipal storage",
          STATUSCODE: "PLANNING",
          WBS: "3.3.0",
        },
      ],
    },
    {
      tableName: "projectschedule",
      rows: [
        {
          ASSIGNEE: "JMILLER",
          ENDDATE: "2026-03-19 00:00:00.000",
          EFFORT: "6.5",
          MODDATE: "2026-03-18 13:10:00.000",
          PRIORITY: "HIGH",
          PROJECTNO: "P-1001",
          PROJECTPERCENTCOMPLETE: "72",
          PROJECTSCHEDULENO: "TS-1001",
          PROJECTTITLE: "Campus AV Refresh",
          SCHED: "Waiting on final client sign-off before procurement can start.",
          SCHEDDATE: "2026-03-17 00:00:00.000",
          SEQ: "10",
          STATUSCODE: "INPROGRESS",
          TASKPERCENTCOMPLETE: "48",
          TITLE: "Secure procurement approval",
          WBS: "1.1.0",
        },
        {
          ASSIGNEE: "RLEE",
          ENDDATE: "2026-03-24 00:00:00.000",
          EFFORT: "3.0",
          MODDATE: "2026-03-23 15:45:00.000",
          PRIORITY: "MEDIUM",
          PROJECTNO: "P-1002",
          PROJECTPERCENTCOMPLETE: "58",
          PROJECTSCHEDULENO: "TS-1002",
          PROJECTTITLE: "Clinic Exam Room Expansion",
          SCHED: "Finance needs revised margin worksheet.",
          SCHEDDATE: "2026-03-23 00:00:00.000",
          SEQ: "20",
          STATUSCODE: "NOTSTARTED",
          TASKPERCENTCOMPLETE: "0",
          TITLE: "Update margin worksheet",
          WBS: "2.4.0",
        },
        {
          ASSIGNEE: "KADAMS",
          ENDDATE: "2026-03-25 00:00:00.000",
          EFFORT: "2.0",
          MODDATE: "2026-03-22 11:30:00.000",
          PRIORITY: "LOW",
          PROJECTNO: "P-1003",
          PROJECTPERCENTCOMPLETE: "22",
          PROJECTSCHEDULENO: "TS-1003",
          PROJECTTITLE: "Council Chamber Modernization",
          SCHED: "Awaiting customer confirmation on room counts.",
          SCHEDDATE: "2026-03-24 00:00:00.000",
          SEQ: "30",
          STATUSCODE: "WAITING",
          TASKPERCENTCOMPLETE: "15",
          TITLE: "Confirm room counts",
          WBS: "3.2.1",
        },
      ],
    },
    {
      tableName: "projectevents",
      rows: [
        {
          COMMENT: "Client approved revised project plan.",
          DATE: "2026-03-21 10:30:00.000",
          PROJECTNO: "P-1001",
          PROJEVENTNO: "EV-1001",
          TYPE: "NOTE",
          USERID: "JMILLER",
        },
        {
          COMMENT: "Billing review flagged missing labor markup.",
          DATE: "2026-03-18 15:10:00.000",
          PROJECTNO: "P-1002",
          PROJEVENTNO: "EV-1002",
          TYPE: "FINANCE",
          USERID: "RLEE",
        },
        {
          COMMENT: "Sales handoff package sent to PM.",
          DATE: "2026-03-22 08:45:00.000",
          PROJECTNO: "P-1003",
          PROJEVENTNO: "EV-1003",
          TYPE: "HANDOFF",
          USERID: "KADAMS",
        },
      ],
    },
    {
      tableName: "timebill",
      rows: [
        {
          CATEGORY: "LABOR",
          CUSTOMERNO: "C10025",
          DATE: "2026-03-21 16:00:00.000",
          DESCRIPTION: "Rack integration and testing",
          PROJECTNO: "P-1001",
          TIMEBILLED: "5.5",
          TIMEBILLNO: "TB-1001",
        },
        {
          CATEGORY: "LABOR",
          CUSTOMERNO: "C10026",
          DATE: "2026-03-20 11:15:00.000",
          DESCRIPTION: "Site walk and pricing update",
          PROJECTNO: "P-1002",
          TIMEBILLED: "3.0",
          TIMEBILLNO: "TB-1002",
        },
        {
          CATEGORY: "ENGINEERING",
          CUSTOMERNO: "C10027",
          DATE: "2026-03-22 17:00:00.000",
          DESCRIPTION: "Design package revision",
          PROJECTNO: "P-1003",
          TIMEBILLED: "4.25",
          TIMEBILLNO: "TB-1003",
        },
      ],
    },
  ]);
}

function seedProjectOnlyFeature1Tables(): void {
  setMockPgTables([
    {
      tableName: "projects",
      rows: [
        {
          CUSTOMERNO: "C10025",
          ENDDATE: "2026-03-28 00:00:00.000",
          HOURSBUDGET: "120",
          PERCENTCOMPLETE: "72",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          PROJECTSTARTDATE: "2026-02-03 00:00:00.000",
          PROJECTFORECASTDATE: "2026-03-20 14:15:00.000",
          REVENUEBUDGET: "85000",
          SALESREP: "JMILLER",
          SITENO: "S-1001",
          STARTDATE: "2026-02-10 00:00:00.000",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
      ],
    },
    {
      tableName: "ldview_project",
      rows: [
        {
          COMPANY: "North Peak University",
          CUSTOMERNO: "C10025",
          ENDDATE: "2026-03-28 00:00:00.000",
          PERCENTCOMPLETE: "72",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          REVENUEBUDGET: "85000",
          SALESREP: "JMILLER",
          SITENAME: "North Peak Main Campus",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
      ],
    },
    {
      tableName: "ldview_projectsnapshot",
      rows: [
        {
          ASOFDATE: "2026-03-23 00:00:00.000",
          CUSTOMERNAME: "North Peak University",
          PROJECTLEADER: "JMILLER",
          PROJECTNO: "P-1001",
          SNAPSHOTHOURS: "88",
          SNAPSHOTLABCOST: "18000",
          SNAPSHOTMATCOST: "24000",
          SNAPSHOTMISCCOST: "2000",
          SNAPSHOTREVENUE: "71000",
          SNAPSHOTSUBCOST: "7000",
          STATUSCODE: "ACTIVE",
          TITLE: "Campus AV Refresh",
        },
      ],
    },
    {
      tableName: "ldview_projectdetail",
      rows: [
        {
          CONITEMNO: "CI-1001",
          COST: "1200",
          DESCRIPTION: "Display package",
          DETAILTYPE: "EQUIPMENT",
          EXTENDEDCOST: "2400",
          EXTENDEDPRICE: "3600",
          ITEMTYPE: "MATERIAL",
          PROJECTNO: "P-1001",
          QTY: "2",
          STAGINGLOCATION: "Warehouse A",
          STATUSCODE: "ACTIVE",
          WBS: "1.2.0",
        },
      ],
    },
  ]);
}

vi.mock("pg", () => ({
  Pool: class MockPool {
    async end(): Promise<void> {
      return;
    }

    async query(sql: string): Promise<{ rows: Record<string, unknown>[] }> {
      if (sql.includes("information_schema.tables")) {
        return {
          rows: [...mockPgTables.values()].map((table) => ({
            table_name: table.tableName,
            table_schema: table.schemaName ?? "public",
          })),
        };
      }

      const match = sql.match(/FROM\s+"([^"]+)"\."([^"]+)"/i);
      if (!match) {
        throw new Error(`Unexpected PostgreSQL query in test: ${sql}`);
      }

      const [, schemaName, tableName] = match;
      const table = mockPgTables.get(buildMockPgTableKey(tableName, schemaName));

      return {
        rows: table ? table.rows.map((row) => ({ ...row })) : [],
      };
    }
  },
}));

import {
  getBillingSummary,
  getBusinessOverview,
  getFollowUps,
  getProjectDetails,
  getProjectActivityStream,
  getProjectProgress,
  getProjectSnapshots,
} from "@/lib/q360/business-read";
import { clearListActionCache } from "@/lib/q360/list-actions";
import { clearMockPostgresCache } from "@/lib/q360/mock-postgres";

const server = setupServer();

describe("business read adapter", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(async () => {
    await clearMockPostgresCache();
    clearListActionCache();
    mockPgTables.clear();
    server.resetHandlers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns project progress from PostgreSQL when DATABASE_URL points to Postgres", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getProjectProgress(10);

    expect(result.sourceName).toBe("postgres:projects");
    expect(result.taskSourceName).toBe("postgres:projectschedule");
    expect(result.warning).toBeNull();
    expect(result.projects).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.activeCount).toBe(3);
    expect(result.summary.overdueCount).toBe(1);
    expect(result.summary.atRiskCount).toBe(2);
    expect(result.projects.every((project) => project.lastActivityAt !== null)).toBe(true);
    expect(result.projects[0]).toEqual(
      expect.objectContaining({
        customerId: "C10026",
        customerName: "Summit Health",
        dueDate: "2026-03-18 00:00:00.000",
        endDate: "2026-03-18 00:00:00.000",
        hoursBudget: 96,
        id: "P-1002",
        openTaskCount: 1,
        overdueTaskCount: 0,
        ownerId: "RLEE",
        percentComplete: 58,
        projectStartDate: "2026-01-15 00:00:00.000",
        revenueBudget: 64000,
        salesRepId: "RLEE",
        siteId: "S-1002",
        siteName: "Summit Clinic East",
        snapshotGrossProfit: -8000,
        startDate: "2026-01-22 00:00:00.000",
        status: "ACTIVE",
        taskCount: 1,
        title: "Clinic Exam Room Expansion",
      }),
    );
    expect(result.projects[1]).toEqual(
      expect.objectContaining({
        id: "P-1001",
        nextTaskDueDate: "2026-03-19 00:00:00.000",
        overdueTaskCount: 1,
      }),
    );
  });

  it("returns follow-up pressure from PostgreSQL when DATABASE_URL points to Postgres", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getFollowUps(10);

    expect(result.sourceName).toBe("postgres:projectschedule");
    expect(result.warning).toBeNull();
    expect(result.tasks).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.overdueTaskCount).toBe(1);
    expect(result.summary.dueTodayCount).toBe(1);
    expect(result.tasks[0]?.isOverdue).toBe(true);
    expect(result.tasks.every((task) => task.updatedAt !== null)).toBe(true);
    expect(result.tasks[0]).toEqual(
      expect.objectContaining({
        dueDate: "2026-03-19 00:00:00.000",
        effort: 6.5,
        endDate: "2026-03-19 00:00:00.000",
        id: "TS-1001",
        isOverdue: true,
        notesExcerpt: "Waiting on final client sign-off before procurement can start.",
        ownerId: "JMILLER",
        priority: "HIGH",
        projectId: "P-1001",
        projectPercentComplete: 72,
        projectTitle: "Campus AV Refresh",
        scheduleDate: "2026-03-17 00:00:00.000",
        sequence: "10",
        status: "INPROGRESS",
        taskPercentComplete: 48,
        title: "Secure procurement approval",
        wbs: "1.1.0",
      }),
    );
    expect(result.tasks[1]).toEqual(
      expect.objectContaining({
        id: "TS-1002",
        isDueToday: true,
        priority: "MEDIUM",
      }),
    );
  });

  it("returns a project activity stream from PostgreSQL when DATABASE_URL points to Postgres", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const result = await getProjectActivityStream(10);

    expect(result.sourceName).toBe("postgres:projectevents");
    expect(result.activities).toHaveLength(3);
    expect(result.summary.handoffCount).toBe(1);
    expect(result.summary.financeCount).toBe(1);
  });

  it("returns a time and billing summary from PostgreSQL when DATABASE_URL points to Postgres", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const result = await getBillingSummary(10);

    expect(result.sourceName).toBe("postgres:timebill");
    expect(result.entries).toHaveLength(3);
    expect(result.summary.totalHoursBilled).toBe(12.75);
  });

  it("returns project snapshots from LDVIEW_PROJECTSNAPSHOT", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const result = await getProjectSnapshots(10);

    expect(result.sourceName).toBe("postgres:ldview_projectsnapshot");
    expect(result.snapshots).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.snapshotRevenueTotal).toBe(166000);
    expect(result.snapshots[0]).toEqual(
      expect.objectContaining({
        customerName: "North Peak University",
        grossMargin: 28.17,
        grossProfit: 20000,
        projectId: "P-1001",
        revenue: 71000,
      }),
    );
  });

  it("returns project detail rows from LDVIEW_PROJECTDETAIL", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const result = await getProjectDetails(10);

    expect(result.sourceName).toBe("postgres:ldview_projectdetail");
    expect(result.details).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.totalExtendedCost).toBe(11600);
    expect(result.summary.totalExtendedPrice).toBe(16400);
    expect(result.details[0]).toEqual(
      expect.objectContaining({
        description: "Display package",
        projectId: "P-1001",
        projectTitle: "Campus AV Refresh",
        wbs: "1.2.0",
      }),
    );
  });

  it("builds a business overview with activity and billing from PostgreSQL", async () => {
    seedFeature1PostgresTables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const overview = await getBusinessOverview({
      activityLimit: 2,
      billingLimit: 2,
      projectLimit: 2,
      taskLimit: 2,
    });

    expect(overview.dataSources.projects).toBe("postgres:projects");
    expect(overview.dataSources.tasks).toBe("postgres:projectschedule");
    expect(overview.dataSources.activity).toBe("postgres:projectevents");
    expect(overview.dataSources.billing).toBe("postgres:timebill");
    expect(overview.dataSources.snapshots).toBe("postgres:ldview_projectsnapshot");
    expect(overview.dataSources.detail).toBe("postgres:ldview_projectdetail");
    expect(overview.projectProgress.projects).toHaveLength(2);
    expect(overview.followUps.tasks).toHaveLength(2);
    expect(overview.activityStream?.activities).toHaveLength(2);
    expect(overview.billingSummary?.entries).toHaveLength(2);
    expect(overview.projectSnapshots?.snapshots).toHaveLength(3);
    expect(overview.projectDetails?.details).toHaveLength(3);
    expect(overview.actionCenter.recommendations).toHaveLength(2);
    expect(overview.actionCenter.summary.highPriorityCount).toBe(2);
    expect(overview.actionCenter.summary.triggeredRuleCounts.overdue_task).toBe(1);
    expect(overview.actionCenter.summary.triggeredRuleCounts.stalled_project).toBe(1);
    expect(overview.actionCenter.agenda).toHaveLength(3);
    expect(overview.summary.overdueProjectCount).toBe(1);
    expect(overview.summary.overdueTaskCount).toBe(1);
    expect(overview.summary.highPriorityActionCount).toBe(2);
    expect(overview.summary.recommendationCount).toBe(2);
    expect(overview.summary.snapshotRevenueTotal).toBe(166000);
    expect(overview.summary.detailLineCount).toBe(3);
    expect(overview.warnings).toHaveLength(0);
    expect(overview.projectProgress.projects[0]).toEqual(
      expect.objectContaining({
        hoursBudget: 96,
        projectStartDate: "2026-01-15 00:00:00.000",
        revenueBudget: 64000,
        salesRepId: "RLEE",
      }),
    );
    expect(overview.followUps.tasks[0]).toEqual(
      expect.objectContaining({
        effort: 6.5,
        priority: "HIGH",
        taskPercentComplete: 48,
        wbs: "1.1.0",
      }),
    );
  });

  it("keeps Feature 1 usable when only project tables are seeded", async () => {
    seedProjectOnlyFeature1Tables();
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const [projectProgress, followUps, overview] = await Promise.all([
      getProjectProgress(10),
      getFollowUps(10),
      getBusinessOverview({ projectLimit: 10, taskLimit: 10 }),
    ]);

    expect(projectProgress.projects).toHaveLength(1);
    expect(projectProgress.projects[0]).toEqual(
      expect.objectContaining({
        customerName: "North Peak University",
        detailLineCount: 1,
        siteName: "North Peak Main Campus",
        snapshotGrossProfit: 20000,
      }),
    );
    expect(projectProgress.taskSourceName).toBe("Unavailable");
    expect(projectProgress.warning).toContain("Project task data unavailable");

    expect(followUps.tasks).toHaveLength(0);
    expect(followUps.sourceName).toBe("Unavailable");
    expect(followUps.warning).toContain("Project task data unavailable");

    expect(overview.projectSnapshots?.snapshots).toHaveLength(1);
    expect(overview.projectDetails?.details).toHaveLength(1);
    expect(overview.warnings.some((warning) => warning.includes("Project task data unavailable"))).toBe(true);
  });

  it("keeps completed tasks out of the follow-up queue even when they were due today", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    server.use(
      http.get("https://example.test/api/Project", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                customerno: "C10025",
                enddate: "2026-03-28 00:00:00.000",
                moddate: "2026-03-23 15:00:00.000",
                projectleader: "JMILLER",
                projectno: "P-1001",
                statuscode: "ACTIVE",
                title: "Campus AV Refresh",
              },
            ],
          },
          success: true,
        }),
      ),
      http.get("https://example.test/api/Task", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                assignee: "JMILLER",
                enddate: "2026-03-24 00:00:00.000",
                moddate: "2026-03-24 08:30:00.000",
                projectno: "P-1001",
                projectscheduleno: "TS-closed",
                projecttitle: "Campus AV Refresh",
                sched: "Already completed this morning.",
                statuscode: "COMPLETED",
                title: "Finish rack integration",
              },
              {
                assignee: "JMILLER",
                enddate: "2026-03-25 00:00:00.000",
                moddate: "2026-03-23 10:15:00.000",
                projectno: "P-1001",
                projectscheduleno: "TS-open",
                projecttitle: "Campus AV Refresh",
                sched: "Still waiting on client sign-off.",
                statuscode: "INPROGRESS",
                title: "Secure procurement approval",
              },
            ],
          },
          success: true,
        }),
      ),
    );

    const result = await getFollowUps(10);

    expect(result.summary.dueTodayCount).toBe(0);
    expect(result.summary.openCount).toBe(1);
    expect(result.summary.totalCount).toBe(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.id).toBe("TS-open");
  });
});
