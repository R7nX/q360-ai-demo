import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BusinessOverviewResponse } from "@/lib/q360/adapter";
import { getBusinessOverview } from "@/lib/q360/adapter";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/q360/adapter", () => ({
  getBusinessOverview: vi.fn(),
}));

describe("Feature 1 page", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("renders the richer project and task context from the overview payload", async () => {
    const overview: BusinessOverviewResponse = {
      actionCenter: {
        agenda: [],
        recommendations: [],
        summary: {
          agendaCount: 0,
          highPriorityCount: 0,
          lowPriorityCount: 0,
          mediumPriorityCount: 0,
          recommendationCount: 0,
          triggeredRuleCounts: {
            billing_gap: 0,
            overdue_task: 0,
            stalled_project: 0,
          },
        },
      },
      activityStream: null,
      billingSummary: null,
      dataSources: {
        activity: null,
        billing: null,
        projects: "mock.db:projects",
        tasks: "mock.db:projectschedule",
      },
      followUps: {
        sourceName: "mock.db:projectschedule",
        summary: {
          dueTodayCount: 0,
          linkedProjectCount: 1,
          openCount: 1,
          overdueTaskCount: 1,
          totalCount: 1,
        },
        tasks: [
          {
            dueDate: "2026-03-19 00:00:00.000",
            effort: 6.5,
            endDate: "2026-03-19 00:00:00.000",
            id: "TS-1001",
            isDueToday: false,
            isOverdue: true,
            notesExcerpt: "Waiting on final client sign-off before procurement can start.",
            ownerId: "JMILLER",
            priority: "HIGH",
            projectId: "P-1001",
            projectPercentComplete: 72,
            projectTitle: "Campus AV Refresh",
            scheduleDate: "2026-03-17 00:00:00.000",
            sequence: "10",
            sourceName: "mock.db:projectschedule",
            status: "INPROGRESS",
            taskPercentComplete: 48,
            title: "Secure procurement approval",
            updatedAt: "2026-03-18 13:10:00.000",
            wbs: "1.1.0",
          },
        ],
      },
      generatedAt: "2026-03-24T12:00:00.000Z",
      projectProgress: {
        projects: [
          {
            atRisk: true,
            customerId: "C10025",
            customerName: "North Peak University",
            dueDate: "2026-03-28 00:00:00.000",
            endDate: "2026-03-28 00:00:00.000",
            hoursBudget: 120,
            id: "P-1001",
            lastActivityAt: "2026-03-20 14:15:00.000",
            nextTaskDueDate: "2026-03-19 00:00:00.000",
            openTaskCount: 1,
            overdueTaskCount: 1,
            ownerId: "JMILLER",
            percentComplete: 72,
            projectStartDate: "2026-02-03 00:00:00.000",
            revenueBudget: 85000,
            salesRepId: "JMILLER",
            siteId: "S-1001",
            sourceName: "mock.db:projects",
            startDate: "2026-02-10 00:00:00.000",
            status: "ACTIVE",
            taskCount: 1,
            title: "Campus AV Refresh",
          },
        ],
        sourceName: "mock.db:projects",
        summary: {
          activeCount: 1,
          atRiskCount: 1,
          overdueCount: 0,
          totalCount: 1,
          withTaskBacklogCount: 1,
        },
        taskSourceName: "mock.db:projectschedule",
      },
      summary: {
        activeProjectCount: 1,
        atRiskProjectCount: 1,
        billedHoursTotal: null,
        dueTodayTaskCount: 0,
        highPriorityActionCount: 0,
        overdueProjectCount: 0,
        overdueTaskCount: 1,
        recentActivityCount: null,
        recommendationCount: 0,
      },
      warnings: [],
    };

    vi.mocked(getBusinessOverview).mockResolvedValue(overview);

    const { default: Feature1Page } = await import("@/app/feature1/page");
    const markup = renderToStaticMarkup(await Feature1Page());

    expect(markup).toContain("Project and task visibility, backed by mock.db.");
    expect(markup).toContain("Customer");
    expect(markup).toContain("Leader");
    expect(markup).toContain("Sales rep");
    expect(markup).toContain("Status");
    expect(markup).toContain("Revenue budget");
    expect(markup).toContain("Project no P-1001");
    expect(markup).toContain("North Peak University (C10025)");
    expect(markup).toContain("S-1001");
    expect(markup).toContain("JMILLER");
    expect(markup).toContain("Percent complete");
    expect(markup).toContain("ACTIVE");
    expect(markup).toContain("72%");
    expect(markup).toContain("Task count");
    expect(markup).toContain("Task no TS-1001");
    expect(markup).toContain("Campus AV Refresh (P-1001)");
    expect(markup).toContain("Priority");
    expect(markup).toContain("Schedule date");
    expect(markup).toContain("WBS");
    expect(markup).toContain("Task completion");
    expect(markup).toContain("Project completion");
    expect(markup).toContain("INPROGRESS");
    expect(markup).toContain("HIGH");
    expect(markup).toContain("1.1.0");
    expect(markup).toContain("6.5");
    expect(markup).toContain("Work note");
    expect(markup).toContain("Waiting on final client sign-off before procurement can start.");
  });
});
