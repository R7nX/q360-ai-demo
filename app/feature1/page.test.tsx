import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BusinessOverviewResponse } from "@/lib/q360/business-read";
import { getBusinessOverview } from "@/lib/q360/business-read";

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

vi.mock("@/lib/q360/business-read", () => ({
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
          triggeredRuleCount: 0,
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
        detail: "postgres:ldview_projectdetail",
        projects: "postgres:projects",
        snapshots: "postgres:ldview_projectsnapshot",
        tasks: "postgres:projectschedule",
      },
      followUps: {
        sourceName: "postgres:projectschedule",
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
            sourceName: "postgres:projectschedule",
            status: "INPROGRESS",
            taskPercentComplete: 48,
            title: "Secure procurement approval",
            updatedAt: "2026-03-18 13:10:00.000",
            wbs: "1.1.0",
          },
        ],
        warning: null,
      },
      generatedAt: "2026-03-24T12:00:00.000Z",
      projectDetails: {
        details: [
          {
            contractItemNo: "CI-1001",
            cost: 1200,
            description: "Display package",
            detailType: "EQUIPMENT",
            extendedCost: 2400,
            extendedPrice: 3600,
            id: "P-1001:CI-1001",
            itemType: "MATERIAL",
            projectId: "P-1001",
            projectTitle: "Campus AV Refresh",
            qty: 2,
            sourceName: "postgres:ldview_projectdetail",
            stagingDescription: null,
            stagingLocation: "Warehouse A",
            status: "ACTIVE",
            wbs: "1.2.0",
          },
        ],
        sourceName: "postgres:ldview_projectdetail",
        summary: {
          projectCount: 1,
          totalCount: 1,
          totalExtendedCost: 2400,
          totalExtendedPrice: 3600,
        },
      },
      projectProgress: {
        projects: [
          {
            atRisk: true,
            customerId: "C10025",
            customerName: "North Peak University",
            detailExtendedCostTotal: 2400,
            detailExtendedPriceTotal: 3600,
            detailLineCount: 1,
            dueDate: "2026-03-28 00:00:00.000",
            endDate: "2026-03-28 00:00:00.000",
            hoursBudget: 120,
            id: "P-1001",
            lastActivityAt: "2026-03-20 14:15:00.000",
            latestSnapshotAt: "2026-03-23 00:00:00.000",
            nextTaskDueDate: "2026-03-19 00:00:00.000",
            openTaskCount: 1,
            overdueTaskCount: 1,
            ownerId: "JMILLER",
            percentComplete: 72,
            projectStartDate: "2026-02-03 00:00:00.000",
            revenueBudget: 85000,
            salesRepId: "JMILLER",
            siteId: "S-1001",
            siteName: "North Peak Main Campus",
            snapshotCostTotal: 51000,
            snapshotGrossMargin: 28,
            snapshotGrossProfit: 20000,
            snapshotRevenue: 71000,
            sourceName: "postgres:projects",
            startDate: "2026-02-10 00:00:00.000",
            status: "ACTIVE",
            taskCount: 1,
            title: "Campus AV Refresh",
          },
        ],
        sourceName: "postgres:projects",
        summary: {
          activeCount: 1,
          atRiskCount: 1,
          overdueCount: 0,
          totalCount: 1,
          withTaskBacklogCount: 1,
        },
        taskSourceName: "postgres:projectschedule",
        warning: null,
      },
      projectSnapshots: {
        snapshots: [
          {
            asOfDate: "2026-03-23 00:00:00.000",
            costTotal: 51000,
            customerName: "North Peak University",
            grossMargin: 28,
            grossProfit: 20000,
            hours: 88,
            id: "P-1001:2026-03-23 00:00:00.000",
            ownerId: "JMILLER",
            projectId: "P-1001",
            projectTitle: "Campus AV Refresh",
            revenue: 71000,
            sourceName: "postgres:ldview_projectsnapshot",
            status: "ACTIVE",
          },
        ],
        sourceName: "postgres:ldview_projectsnapshot",
        summary: {
          marginAlertCount: 0,
          snapshotRevenueTotal: 71000,
          totalCount: 1,
        },
      },
      summary: {
        activeProjectCount: 1,
        atRiskProjectCount: 1,
        billedHoursTotal: null,
        detailLineCount: 1,
        dueTodayTaskCount: 0,
        highPriorityActionCount: 0,
        overdueProjectCount: 0,
        overdueTaskCount: 1,
        recentActivityCount: null,
        recommendationCount: 0,
        snapshotRevenueTotal: 71000,
      },
      warnings: [],
    };

    vi.mocked(getBusinessOverview).mockResolvedValue(overview);

    const { default: Feature1Page } = await import("@/app/feature1/page");
    const markup = renderToStaticMarkup(await Feature1Page());

    expect(markup).toContain("Project visibility, backed by PostgreSQL.");
    expect(markup).toContain("Customer");
    expect(markup).toContain("Leader");
    expect(markup).toContain("Sales rep");
    expect(markup).toContain("Status");
    expect(markup).toContain("Revenue budget");
    expect(markup).toContain("Project no P-1001");
    expect(markup).toContain("North Peak University (C10025)");
    expect(markup).toContain("North Peak Main Campus (S-1001)");
    expect(markup).toContain("JMILLER");
    expect(markup).toContain("Percent complete");
    expect(markup).toContain("ACTIVE");
    expect(markup).toContain("72%");
    expect(markup).toContain("Detail lines");
    expect(markup).toContain("Snapshot Rollups");
    expect(markup).toContain("Scope Detail");
    expect(markup).toContain("Snapshot margin");
    expect(markup).toContain("Snapshot profit");
    expect(markup).toContain("Display package");
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
