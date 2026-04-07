/**
 * Tests for `POST /api/feature2/overdue` batch analysis and empty-state responses.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Dispatch } from "@/types/q360";

const {
  mockGenerateJSON,
  mockGetDispatchesFromMockDb,
  mockGetAllCustomersFromMockDb,
  mockGetAllSitesFromMockDb,
  mockOverdueBatchSystemPrompt,
  mockOverdueBatchUserPrompt,
} = vi.hoisted(() => ({
  mockGenerateJSON: vi.fn(),
  mockGetDispatchesFromMockDb: vi.fn(),
  mockGetAllCustomersFromMockDb: vi.fn(),
  mockGetAllSitesFromMockDb: vi.fn(),
  mockOverdueBatchSystemPrompt: vi.fn(),
  mockOverdueBatchUserPrompt: vi.fn(),
}));

vi.mock("@/lib/agentClient", () => ({
  generateJSON: mockGenerateJSON,
}));

vi.mock("@/lib/mockDb", () => ({
  getDispatchesFromMockDb: mockGetDispatchesFromMockDb,
  getAllCustomersFromMockDb: mockGetAllCustomersFromMockDb,
  getAllSitesFromMockDb: mockGetAllSitesFromMockDb,
}));

vi.mock("@/lib/emailPrompts", () => ({
  overdueBatchSystemPrompt: mockOverdueBatchSystemPrompt,
  overdueBatchUserPrompt: mockOverdueBatchUserPrompt,
}));

vi.mock("@/lib/q360Client", () => ({
  FALLBACK_DISPATCHES: [],
  FALLBACK_CUSTOMERS: {},
  FALLBACK_SITES: {},
}));

import { POST } from "@/app/api/feature2/overdue/route";

function makeDispatch(overrides: Partial<Dispatch> = {}): Dispatch {
  return {
    dispatchno: overrides.dispatchno ?? "D-001",
    callno: overrides.callno ?? "CALL-001",
    customerno: overrides.customerno ?? "CUST-001",
    siteno: overrides.siteno ?? "SITE-001",
    statuscode: overrides.statuscode ?? "OPEN",
    problem: overrides.problem ?? "Problem text",
    solution: overrides.solution ?? null,
    priority: overrides.priority ?? null,
    techassigned: overrides.techassigned ?? null,
    date: overrides.date ?? "2020-01-01",
    closedate: overrides.closedate ?? null,
    estfixtime: overrides.estfixtime ?? "2020-01-10",
    callername: overrides.callername ?? null,
    calleremail: overrides.calleremail ?? null,
    callerphone: overrides.callerphone ?? null,
    description: overrides.description ?? null,
  };
}

beforeEach(() => {
  vi.resetAllMocks();

  mockGetDispatchesFromMockDb.mockResolvedValue([]);
  mockGetAllCustomersFromMockDb.mockResolvedValue({});
  mockGetAllSitesFromMockDb.mockResolvedValue({});

  mockOverdueBatchSystemPrompt.mockReturnValue("OVERDUE_SYS");
  mockOverdueBatchUserPrompt.mockReturnValue("OVERDUE_USER");
  mockGenerateJSON.mockResolvedValue(
    JSON.stringify({
      summary: {
        totalScanned: 1,
        totalOverdue: 1,
        critical: 1,
        high: 0,
        medium: 0,
      },
      alerts: [],
    })
  );
});

describe("POST /api/feature2/overdue", () => {
  it("returns empty state when there are no open dispatches", async () => {
    mockGetDispatchesFromMockDb.mockResolvedValue([
      makeDispatch({ statuscode: "CLOSED" }),
    ]);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      state: "empty",
      data: null,
    });
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it("returns all_clear when open dispatches exist but none are overdue", async () => {
    mockGetDispatchesFromMockDb.mockResolvedValue([
      makeDispatch({
        statuscode: "OPEN",
        estfixtime: "2999-01-01",
      }),
    ]);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.state).toBe("all_clear");
    expect(body.data).toBeNull();
    expect(body.message).toContain("within SLA");
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it("parses valid JSON wrapped in markdown fences", async () => {
    mockGetDispatchesFromMockDb.mockResolvedValue([
      makeDispatch({ dispatchno: "D-OVER-1", statuscode: "OPEN" }),
    ]);
    mockGenerateJSON.mockResolvedValue(
      "```json\n{\"summary\":{\"totalScanned\":1,\"totalOverdue\":1,\"critical\":1,\"high\":0,\"medium\":0},\"alerts\":[]}\n```"
    );

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.state).toBe("alerts");
    expect(body.data.summary.totalOverdue).toBe(1);
    expect(mockGenerateJSON).toHaveBeenCalledWith(
      "OVERDUE_SYS",
      "OVERDUE_USER",
      8192
    );
  });

  it("caps analyzed overdue dispatches at 15", async () => {
    const overdueDispatches = Array.from({ length: 20 }, (_, i) =>
      makeDispatch({
        dispatchno: `D-${i + 1}`,
        statuscode: "OPEN",
        estfixtime: "2020-01-01",
      })
    );
    mockGetDispatchesFromMockDb.mockResolvedValue(overdueDispatches);

    await POST();

    expect(mockOverdueBatchUserPrompt).toHaveBeenCalledTimes(1);
    const [inputs, totalScanned] = mockOverdueBatchUserPrompt.mock.calls[0];
    expect(inputs).toHaveLength(15);
    expect(totalScanned).toBe(20);
  });

  it("returns 502 when AI response is invalid JSON", async () => {
    mockGetDispatchesFromMockDb.mockResolvedValue([
      makeDispatch({ statuscode: "OPEN", estfixtime: "2020-01-01" }),
    ]);
    mockGenerateJSON.mockResolvedValue("not-json-at-all");

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toMatchObject({
      success: false,
      state: "error",
      data: null,
    });
    expect(body.message).toContain("invalid JSON");
  });

  it("returns 500 when data fetch throws", async () => {
    mockGetDispatchesFromMockDb.mockRejectedValue(new Error("db unavailable"));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toMatchObject({
      success: false,
      state: "error",
      data: null,
    });
    expect(body.message).toContain("Failed to scan dispatches");
  });
});

