import Database from "better-sqlite3";
import fs from "fs";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import os from "os";
import path from "path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  getBillingSummary,
  getBusinessOverview,
  getFollowUps,
  getProjectActivityStream,
  getProjectProgress,
} from "@/lib/q360/business-read";
import { clearListActionCache } from "@/lib/q360/list-actions";

const server = setupServer();
const tempDirectories = new Set<string>();

function createFeature1MockDb(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "q360-team1-business-read-"));
  tempDirectories.add(tempDir);

  const dbPath = path.join(tempDir, "feature1.sqlite");
  const db = new Database(dbPath);

  try {
    db.exec(`
      CREATE TABLE projects (
        PROJECTNO TEXT PRIMARY KEY,
        TITLE TEXT,
        CUSTOMERNO TEXT,
        CUSTOMER_COMPANY TEXT,
        STATUSCODE TEXT,
        ENDDATE TEXT,
        PROJECTSTARTDATE TEXT,
        STARTDATE TEXT,
        PROJECTLEADER TEXT,
        MODDATE TEXT,
        PERCENTCOMPLETE TEXT,
        HOURSBUDGET TEXT,
        REVENUEBUDGET TEXT,
        SITENO TEXT,
        SALESREP TEXT
      );
      CREATE TABLE projectschedule (
        PROJECTSCHEDULENO TEXT PRIMARY KEY,
        PROJECTNO TEXT,
        PROJECTTITLE TEXT,
        TITLE TEXT,
        STATUSCODE TEXT,
        SCHEDDATE TEXT,
        ENDDATE TEXT,
        ASSIGNEE TEXT,
        EFFORT TEXT,
        PRIORITY TEXT,
        TASKPERCENTCOMPLETE TEXT,
        PROJECTPERCENTCOMPLETE TEXT,
        WBS TEXT,
        SCHED TEXT,
        MODDATE TEXT,
        SEQ TEXT
      );
      CREATE TABLE projectevents (
        PROJEVENTNO TEXT PRIMARY KEY,
        PROJECTNO TEXT,
        USERID TEXT,
        DATE TEXT,
        TYPE TEXT,
        COMMENT TEXT
      );
      CREATE TABLE timebill (
        TIMEBILLNO TEXT PRIMARY KEY,
        PROJECTNO TEXT,
        CUSTOMERNO TEXT,
        DATE TEXT,
        TIMEBILLED TEXT,
        CATEGORY TEXT,
        DESCRIPTION TEXT
      );
    `);

    const insertProject = db.prepare(`
      INSERT INTO projects (
        PROJECTNO, TITLE, CUSTOMERNO, CUSTOMER_COMPANY, STATUSCODE, ENDDATE, PROJECTSTARTDATE, STARTDATE,
        PROJECTLEADER, MODDATE, PERCENTCOMPLETE, HOURSBUDGET, REVENUEBUDGET, SITENO, SALESREP
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProject.run(
      "P-1001",
      "Campus AV Refresh",
      "C10025",
      "North Peak University",
      "ACTIVE",
      "2026-03-28 00:00:00.000",
      "2026-02-03 00:00:00.000",
      "2026-02-10 00:00:00.000",
      "JMILLER",
      "2026-03-20 14:15:00.000",
      "72",
      "120",
      "85000",
      "S-1001",
      "JMILLER",
    );
    insertProject.run(
      "P-1002",
      "Clinic Exam Room Expansion",
      "C10026",
      "Summit Health",
      "ACTIVE",
      "2026-03-18 00:00:00.000",
      "2026-01-15 00:00:00.000",
      "2026-01-22 00:00:00.000",
      "RLEE",
      "2026-03-01 09:00:00.000",
      "58",
      "96",
      "64000",
      "S-1002",
      "RLEE",
    );
    insertProject.run(
      "P-1003",
      "Council Chamber Modernization",
      "C10027",
      "City of Fairfield",
      "PLANNING",
      "2026-04-11 00:00:00.000",
      "2026-02-25 00:00:00.000",
      "2026-03-02 00:00:00.000",
      "KADAMS",
      "2026-03-22 16:40:00.000",
      "22",
      "140",
      "132000",
      "S-1003",
      "KADAMS",
    );

    const insertTask = db.prepare(`
      INSERT INTO projectschedule (
        PROJECTSCHEDULENO, PROJECTNO, PROJECTTITLE, TITLE, STATUSCODE, SCHEDDATE, ENDDATE,
        ASSIGNEE, EFFORT, PRIORITY, TASKPERCENTCOMPLETE, PROJECTPERCENTCOMPLETE, WBS,
        SCHED, MODDATE, SEQ
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTask.run(
      "TS-1001",
      "P-1001",
      "Campus AV Refresh",
      "Secure procurement approval",
      "INPROGRESS",
      "2026-03-17 00:00:00.000",
      "2026-03-19 00:00:00.000",
      "JMILLER",
      "6.5",
      "HIGH",
      "48",
      "72",
      "1.1.0",
      "Waiting on final client sign-off before procurement can start.",
      "2026-03-18 13:10:00.000",
      "10",
    );
    insertTask.run(
      "TS-1002",
      "P-1002",
      "Clinic Exam Room Expansion",
      "Update margin worksheet",
      "NOTSTARTED",
      "2026-03-23 00:00:00.000",
      "2026-03-24 00:00:00.000",
      "RLEE",
      "3.0",
      "MEDIUM",
      "0",
      "58",
      "2.4.0",
      "Finance needs revised margin worksheet.",
      "2026-03-23 15:45:00.000",
      "20",
    );
    insertTask.run(
      "TS-1003",
      "P-1003",
      "Council Chamber Modernization",
      "Confirm room counts",
      "WAITING",
      "2026-03-24 00:00:00.000",
      "2026-03-25 00:00:00.000",
      "KADAMS",
      "2.0",
      "LOW",
      "15",
      "22",
      "3.2.1",
      "Awaiting customer confirmation on room counts.",
      "2026-03-22 11:30:00.000",
      "30",
    );

    const insertEvent = db.prepare(`
      INSERT INTO projectevents (PROJEVENTNO, PROJECTNO, USERID, DATE, TYPE, COMMENT)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertEvent.run(
      "EV-1001",
      "P-1001",
      "JMILLER",
      "2026-03-21 10:30:00.000",
      "NOTE",
      "Client approved revised project plan.",
    );
    insertEvent.run(
      "EV-1002",
      "P-1002",
      "RLEE",
      "2026-03-18 15:10:00.000",
      "FINANCE",
      "Billing review flagged missing labor markup.",
    );
    insertEvent.run(
      "EV-1003",
      "P-1003",
      "KADAMS",
      "2026-03-22 08:45:00.000",
      "HANDOFF",
      "Sales handoff package sent to PM.",
    );

    const insertTimebill = db.prepare(`
      INSERT INTO timebill (TIMEBILLNO, PROJECTNO, CUSTOMERNO, DATE, TIMEBILLED, CATEGORY, DESCRIPTION)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertTimebill.run(
      "TB-1001",
      "P-1001",
      "C10025",
      "2026-03-21 16:00:00.000",
      "5.5",
      "LABOR",
      "Rack integration and testing",
    );
    insertTimebill.run(
      "TB-1002",
      "P-1002",
      "C10026",
      "2026-03-20 11:15:00.000",
      "3.0",
      "LABOR",
      "Site walk and pricing update",
    );
    insertTimebill.run(
      "TB-1003",
      "P-1003",
      "C10027",
      "2026-03-22 17:00:00.000",
      "4.25",
      "ENGINEERING",
      "Design package revision",
    );
  } finally {
    db.close();
  }

  return dbPath;
}

describe("business read adapter", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    clearListActionCache();
    server.resetHandlers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    for (const tempDirectory of tempDirectories) {
      fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
    tempDirectories.clear();
  });

  afterAll(() => {
    server.close();
  });

  it("returns project progress from mock.db in mock mode", async () => {
    const dbPath = createFeature1MockDb();
    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getProjectProgress(10);

    expect(result.sourceName).toBe("mock.db:projects");
    expect(result.taskSourceName).toBe("mock.db:projectschedule");
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

  it("returns follow-up pressure from mock.db in mock mode", async () => {
    const dbPath = createFeature1MockDb();
    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getFollowUps(10);

    expect(result.sourceName).toBe("mock.db:projectschedule");
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

  it("returns a project activity stream from mock.db in mock mode", async () => {
    const dbPath = createFeature1MockDb();
    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);

    const result = await getProjectActivityStream(10);

    expect(result.sourceName).toBe("mock.db:projectevents");
    expect(result.activities).toHaveLength(3);
    expect(result.summary.handoffCount).toBe(1);
    expect(result.summary.financeCount).toBe(1);
  });

  it("returns a time and billing summary from mock.db in mock mode", async () => {
    const dbPath = createFeature1MockDb();
    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);

    const result = await getBillingSummary(10);

    expect(result.sourceName).toBe("mock.db:timebill");
    expect(result.entries).toHaveLength(3);
    expect(result.summary.totalHoursBilled).toBe(12.75);
  });

  it("builds a business overview with activity and billing from mock.db", async () => {
    const dbPath = createFeature1MockDb();
    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const overview = await getBusinessOverview({
      activityLimit: 2,
      billingLimit: 2,
      projectLimit: 2,
      taskLimit: 2,
    });

    expect(overview.dataSources.projects).toBe("mock.db:projects");
    expect(overview.dataSources.tasks).toBe("mock.db:projectschedule");
    expect(overview.dataSources.activity).toBe("mock.db:projectevents");
    expect(overview.dataSources.billing).toBe("mock.db:timebill");
    expect(overview.projectProgress.projects).toHaveLength(2);
    expect(overview.followUps.tasks).toHaveLength(2);
    expect(overview.activityStream?.activities).toHaveLength(2);
    expect(overview.billingSummary?.entries).toHaveLength(2);
    expect(overview.actionCenter.recommendations).toHaveLength(2);
    expect(overview.actionCenter.summary.highPriorityCount).toBe(2);
    expect(overview.actionCenter.summary.triggeredRuleCounts.overdue_task).toBe(1);
    expect(overview.actionCenter.summary.triggeredRuleCounts.stalled_project).toBe(1);
    expect(overview.actionCenter.agenda).toHaveLength(3);
    expect(overview.summary.overdueProjectCount).toBe(1);
    expect(overview.summary.overdueTaskCount).toBe(1);
    expect(overview.summary.highPriorityActionCount).toBe(2);
    expect(overview.summary.recommendationCount).toBe(2);
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
