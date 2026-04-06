/**
 * Tests for `POST /api/ai/draft-email` validation, streaming, and error mapping.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Dispatch, Customer, Site } from "@/types/q360";

const {
  mockGenerateStream,
  mockFormatDispatchForPrompt,
  mockGetDispatchByIdFromMockDb,
  mockGetCustomerFromMockDb,
  mockGetSiteFromMockDb,
  mockProjectStatusSystemPrompt,
  mockProjectStatusUserPrompt,
  mockServiceClosureSystemPrompt,
  mockServiceClosureUserPrompt,
  mockOverdueAlertSystemPrompt,
  mockOverdueAlertUserPrompt,
  mockNewCallAckSystemPrompt,
  mockNewCallAckUserPrompt,
  fallbackDispatch,
  fallbackCustomer,
  fallbackSite,
  dbDispatch,
  dbCustomer,
  dbSite,
} = vi.hoisted(() => {
  const fallbackDispatch: Dispatch = {
    dispatchno: "FB-AI-001",
    callno: "CALL-FB-AI-1",
    customerno: "CUST-FB-AI-1",
    siteno: "SITE-FB-AI-1",
    statuscode: "OPEN",
    problem: "Fallback AI dispatch problem",
    solution: null,
    priority: "2",
    techassigned: null,
    date: "2026-03-01",
    closedate: null,
    estfixtime: "2026-03-05",
    callername: "Fallback Caller",
    calleremail: "fallback-ai@example.com",
    callerphone: "555-0000",
    description: "Fallback AI description",
  };

  const fallbackCustomer: Customer = {
    customerno: "CUST-FB-AI-1",
    company: "Fallback AI Co",
    type: "Commercial",
    status: "Active",
  };

  const fallbackSite: Site = {
    siteno: "SITE-FB-AI-1",
    sitename: "Fallback AI HQ",
    address: "1 Fallback Way",
    city: "Denver",
    state: "CO",
    zip: "80014",
    phone: "555-1010",
  };

  const dbDispatch: Dispatch = {
    dispatchno: "DB-AI-001",
    callno: "CALL-DB-AI-1",
    customerno: "CUST-DB-AI-1",
    siteno: "SITE-DB-AI-1",
    statuscode: "OPEN",
    problem: "DB AI dispatch problem",
    solution: "DB AI solution",
    priority: "1",
    techassigned: "Alex Tech",
    date: "2026-03-10",
    closedate: null,
    estfixtime: "2026-03-14",
    callername: "DB Caller",
    calleremail: "db-ai@example.com",
    callerphone: "555-2020",
    description: "DB AI description",
  };

  const dbCustomer: Customer = {
    customerno: "CUST-DB-AI-1",
    company: "DB AI Customer",
    type: "Commercial",
    status: "Active",
  };

  const dbSite: Site = {
    siteno: "SITE-DB-AI-1",
    sitename: "DB AI Site",
    address: "100 Main St",
    city: "Salt Lake City",
    state: "UT",
    zip: "84101",
    phone: "555-3030",
  };

  return {
    mockGenerateStream: vi.fn(),
    mockFormatDispatchForPrompt: vi.fn(),
    mockGetDispatchByIdFromMockDb: vi.fn(),
    mockGetCustomerFromMockDb: vi.fn(),
    mockGetSiteFromMockDb: vi.fn(),
    mockProjectStatusSystemPrompt: vi.fn(),
    mockProjectStatusUserPrompt: vi.fn(),
    mockServiceClosureSystemPrompt: vi.fn(),
    mockServiceClosureUserPrompt: vi.fn(),
    mockOverdueAlertSystemPrompt: vi.fn(),
    mockOverdueAlertUserPrompt: vi.fn(),
    mockNewCallAckSystemPrompt: vi.fn(),
    mockNewCallAckUserPrompt: vi.fn(),
    fallbackDispatch,
    fallbackCustomer,
    fallbackSite,
    dbDispatch,
    dbCustomer,
    dbSite,
  };
});

vi.mock("@/lib/agentClient", () => ({
  generateStream: mockGenerateStream,
}));

vi.mock("@/lib/q360Client", () => ({
  formatDispatchForPrompt: mockFormatDispatchForPrompt,
  FALLBACK_DISPATCHES: [fallbackDispatch],
  FALLBACK_CUSTOMERS: { [fallbackCustomer.customerno]: fallbackCustomer },
  FALLBACK_SITES: { [fallbackSite.siteno]: fallbackSite },
}));

vi.mock("@/lib/mockDb", () => ({
  getDispatchByIdFromMockDb: mockGetDispatchByIdFromMockDb,
  getCustomerFromMockDb: mockGetCustomerFromMockDb,
  getSiteFromMockDb: mockGetSiteFromMockDb,
}));

vi.mock("@/lib/emailPrompts", () => ({
  projectStatusSystemPrompt: mockProjectStatusSystemPrompt,
  projectStatusUserPrompt: mockProjectStatusUserPrompt,
  serviceClosureSystemPrompt: mockServiceClosureSystemPrompt,
  serviceClosureUserPrompt: mockServiceClosureUserPrompt,
  overdueAlertSystemPrompt: mockOverdueAlertSystemPrompt,
  overdueAlertUserPrompt: mockOverdueAlertUserPrompt,
  newCallAckSystemPrompt: mockNewCallAckSystemPrompt,
  newCallAckUserPrompt: mockNewCallAckUserPrompt,
}));

import { POST } from "@/app/api/ai/draft-email/route";

function makeTextStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ai/draft-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();

  mockGetDispatchByIdFromMockDb.mockResolvedValue(dbDispatch);
  mockGetCustomerFromMockDb.mockResolvedValue(dbCustomer);
  mockGetSiteFromMockDb.mockResolvedValue(dbSite);
  mockFormatDispatchForPrompt.mockReturnValue("FORMATTED_DATA");

  mockProjectStatusSystemPrompt.mockReturnValue("SYS_PROJECT");
  mockProjectStatusUserPrompt.mockReturnValue("USER_PROJECT");
  mockServiceClosureSystemPrompt.mockReturnValue("SYS_CLOSURE");
  mockServiceClosureUserPrompt.mockReturnValue("USER_CLOSURE");
  mockOverdueAlertSystemPrompt.mockReturnValue("SYS_OVERDUE");
  mockOverdueAlertUserPrompt.mockReturnValue("USER_OVERDUE");
  mockNewCallAckSystemPrompt.mockReturnValue("SYS_ACK");
  mockNewCallAckUserPrompt.mockReturnValue("USER_ACK");

  mockGenerateStream.mockResolvedValue(
    makeTextStream("SUBJECT: Draft\n\nBody text")
  );
});

describe("POST /api/ai/draft-email", () => {
  it("returns 400 when JSON body is invalid", async () => {
    const req = new Request("http://localhost/api/ai/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad-json",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("Invalid JSON body");
  });

  it("returns 400 when entityId is missing", async () => {
    const res = await POST(
      makeRequest({
        intent: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("entityId is required");
  });

  it("returns 400 for invalid intent", async () => {
    const res = await POST(
      makeRequest({
        entityId: "DB-AI-001",
        intent: "invalid-intent",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("Invalid intent");
  });

  it("returns 400 for invalid tone", async () => {
    const res = await POST(
      makeRequest({
        entityId: "DB-AI-001",
        intent: "project-status",
        tone: "super-casual",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("Invalid tone");
  });

  it("returns 400 when entityType is unsupported", async () => {
    const res = await POST(
      makeRequest({
        entityType: "project",
        entityId: "P-001",
        intent: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain('Invalid entityType. Supported: "dispatch".');
  });

  it("returns 404 when dispatch cannot be resolved", async () => {
    mockGetDispatchByIdFromMockDb.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        entityId: "MISSING-001",
        intent: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(404);
    await expect(res.text()).resolves.toContain("not found");
  });

  it("applies default tone and appends audience hint to prompt input", async () => {
    const res = await POST(
      makeRequest({
        entityId: "DB-AI-001",
        intent: "project-status",
        audience: "internal",
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockProjectStatusUserPrompt).toHaveBeenCalledWith(
      "FORMATTED_DATA\nIntended Audience: internal",
      "professional"
    );
    expect(mockGenerateStream).toHaveBeenCalledWith("SYS_PROJECT", "USER_PROJECT");
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("returns 500 when stream generation throws", async () => {
    mockGenerateStream.mockRejectedValue(new Error("stream broken"));

    const res = await POST(
      makeRequest({
        entityId: "DB-AI-001",
        intent: "project-status",
        tone: "friendly",
      }) as never
    );

    expect(res.status).toBe(500);
    await expect(res.text()).resolves.toContain("Failed to generate email");
  });
});
