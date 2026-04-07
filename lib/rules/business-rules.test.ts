import { describe, expect, it, vi } from "vitest";

import { buildActionCenter } from "@/lib/rules/business-rules";

describe("business rules", () => {
  it("builds deterministic recommendations and a ranked agenda from project and task data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const result = buildActionCenter({
      activityStream: null,
      billingSummary: {
        entries: [
          {
            billedAt: "2026-03-21 16:00:00.000",
            category: "LABOR",
            description: "Recent billed work",
            hoursBilled: 5.5,
            id: "TB-1001",
            projectId: "P-1001",
            projectTitle: "Campus AV Refresh",
            sourceName: "TIMEBILL",
          },
        ],
      },
      followUps: {
        tasks: [
          {
            dueDate: "2026-03-19 00:00:00.000",
            id: "TS-1001",
            isDueToday: false,
            isOverdue: true,
            notesExcerpt: "Waiting on final client sign-off.",
            ownerId: "JMILLER",
            projectId: "P-1001",
            projectTitle: "Campus AV Refresh",
            sourceName: "Task",
            status: "INPROGRESS",
            title: "Secure procurement approval",
            updatedAt: "2026-03-20 14:15:00.000",
          },
          {
            dueDate: "2026-03-24 00:00:00.000",
            id: "TS-1002",
            isDueToday: true,
            isOverdue: false,
            notesExcerpt: "Finance needs revised margin worksheet.",
            ownerId: "RLEE",
            projectId: "P-1002",
            projectTitle: "Clinic Exam Room Expansion",
            sourceName: "Task",
            status: "NOTSTARTED",
            title: "Update margin worksheet",
            updatedAt: "2026-03-24 08:00:00.000",
          },
        ],
      },
      projectProgress: {
        projects: [
          {
            atRisk: true,
            dueDate: "2026-03-28 00:00:00.000",
            id: "P-1001",
            lastActivityAt: "2026-03-20 14:15:00.000",
            nextTaskDueDate: "2026-03-19 00:00:00.000",
            openTaskCount: 1,
            overdueTaskCount: 1,
            ownerId: "JMILLER",
            sourceName: "Project",
            status: "ACTIVE",
            taskCount: 1,
            title: "Campus AV Refresh",
          },
          {
            atRisk: true,
            dueDate: "2026-03-18 00:00:00.000",
            id: "P-1002",
            lastActivityAt: "2026-03-01 09:00:00.000",
            nextTaskDueDate: "2026-03-24 00:00:00.000",
            openTaskCount: 1,
            overdueTaskCount: 0,
            ownerId: "RLEE",
            sourceName: "Project",
            status: "ACTIVE",
            taskCount: 1,
            title: "Clinic Exam Room Expansion",
          },
        ],
      },
    });

    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations.map((recommendation) => recommendation.code)).toEqual([
      "overdue_task",
      "stalled_project",
    ]);
    expect(result.summary.highPriorityCount).toBe(2);
    expect(result.summary.triggeredRuleCounts.overdue_task).toBe(1);
    expect(result.summary.triggeredRuleCounts.stalled_project).toBe(1);
    expect(result.agenda).toHaveLength(3);
    expect(result.agenda[0]?.kind).toBe("task");
    expect(result.agenda[0]?.title).toContain("Secure procurement approval");
    vi.useRealTimers();
  });
});
