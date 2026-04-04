import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

describe("business read adapter", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    clearListActionCache();
    server.resetHandlers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns project progress from the project list endpoint in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getProjectProgress(10);

    expect(result.sourceName).toBe("Project");
    expect(result.taskSourceName).toBe("Task");
    expect(result.projects).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.activeCount).toBe(3);
    expect(result.summary.overdueCount).toBe(1);
    expect(result.summary.atRiskCount).toBe(2);
    expect(result.projects.every((project) => project.lastActivityAt !== null)).toBe(true);
  });

  it("returns follow-up pressure from the task list endpoint in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = await getFollowUps(10);

    expect(result.sourceName).toBe("Task");
    expect(result.tasks).toHaveLength(3);
    expect(result.summary.totalCount).toBe(3);
    expect(result.summary.overdueTaskCount).toBe(1);
    expect(result.summary.dueTodayCount).toBe(1);
    expect(result.tasks[0]?.isOverdue).toBe(true);
    expect(result.tasks.every((task) => task.updatedAt !== null)).toBe(true);
  });

  it("returns a project activity stream in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");

    const result = await getProjectActivityStream(10);

    expect(result.sourceName).toBe("PROJECTEVENTS");
    expect(result.activities).toHaveLength(3);
    expect(result.summary.handoffCount).toBe(1);
    expect(result.summary.financeCount).toBe(1);
  });

  it("returns a time and billing summary in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");

    const result = await getBillingSummary(10);

    expect(result.sourceName).toBe("TIMEBILL");
    expect(result.entries).toHaveLength(3);
    expect(result.summary.totalHoursBilled).toBe(12.75);
  });

  it("builds a business overview with activity and billing in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const overview = await getBusinessOverview({
      activityLimit: 2,
      billingLimit: 2,
      projectLimit: 2,
      taskLimit: 2,
    });

    expect(overview.dataSources.projects).toBe("Project");
    expect(overview.dataSources.tasks).toBe("Task");
    expect(overview.dataSources.activity).toBe("PROJECTEVENTS");
    expect(overview.dataSources.billing).toBe("TIMEBILL");
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
