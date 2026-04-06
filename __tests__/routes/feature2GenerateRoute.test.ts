import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Dispatch, Customer, Site } from "@/types/q360";

const {
  mockGenerateStream,
  mockFormatDispatchForPrompt,
  mockGetDispatchByIdFromMockDb,
  mockGetCustomerFromMockDb,
  mockGetSiteFromMockDb,
  mockGetTimeBillsFromMockDb,
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
    dispatchno: "FB-001",
    callno: "CALL-FB-1",
    customerno: "CUST-FB-1",
    siteno: "SITE-FB-1",
    statuscode: "OPEN",
    problem: "Fallback dispatch problem",
    solution: null,
    priority: "2",
    techassigned: null,
    date: "2026-03-01",
    closedate: null,
    estfixtime: "2026-03-05",
    callername: "Fallback Caller",
    calleremail: "fallback@example.com",
    callerphone: "555-0000",
    description: "Fallback description",
  };

  const fallbackCustomer: Customer = {
    customerno: "CUST-FB-1",
    company: "Fallback Co",
    type: "Commercial",
    status: "Active",
  };

  const fallbackSite: Site = {
    siteno: "SITE-FB-1",
    sitename: "Fallback HQ",
    address: "1 Fallback Way",
    city: "Denver",
    state: "CO",
    zip: "80014",
    phone: "555-1010",
  };

  const dbDispatch: Dispatch = {
    dispatchno: "DB-001",
    callno: "CALL-DB-1",
    customerno: "CUST-DB-1",
    siteno: "SITE-DB-1",
    statuscode: "OPEN",
    problem: "DB dispatch problem",
    solution: "DB solution",
    priority: "1",
    techassigned: "Alex Tech",
    date: "2026-03-10",
    closedate: null,
    estfixtime: "2026-03-14",
    callername: "DB Caller",
    calleremail: "db@example.com",
    callerphone: "555-2020",
    description: "DB description",
  };

  const dbCustomer: Customer = {
    customerno: "CUST-DB-1",
    company: "DB Customer",
    type: "Commercial",
    status: "Active",
  };

  const dbSite: Site = {
    siteno: "SITE-DB-1",
    sitename: "DB Site",
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
    mockGetTimeBillsFromMockDb: vi.fn(),
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
  getTimeBillsFromMockDb: mockGetTimeBillsFromMockDb,
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

import { POST } from "@/app/api/feature2/generate/route";

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
  return new Request("http://localhost/api/feature2/generate", {
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
  mockGetTimeBillsFromMockDb.mockResolvedValue([]);

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
    makeTextStream("SUBJECT: Test Subject\n\nEmail body")
  );
});

describe("POST /api/feature2/generate", () => {
  it("returns 400 when body JSON is invalid", async () => {
    const req = new Request("http://localhost/api/feature2/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("Invalid JSON body");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(
      makeRequest({
        recordId: "DB-001",
        automationType: "project-status",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("recordId and tone are required");
  });

  it("returns 400 for unsupported automation type", async () => {
    const res = await POST(
      makeRequest({
        recordId: "DB-001",
        automationType: "not-real",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain("Unsupported automation type");
  });

  it("returns 404 when dispatch is not in mock DB or fallback data", async () => {
    mockGetDispatchByIdFromMockDb.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        recordId: "MISSING-123",
        automationType: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(404);
    await expect(res.text()).resolves.toContain("Dispatch MISSING-123 not found");
  });

  it("uses fallback dispatch data when mock DB lookup misses", async () => {
    mockGetDispatchByIdFromMockDb.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        recordId: "FB-001",
        automationType: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockFormatDispatchForPrompt).toHaveBeenCalledWith(
      fallbackDispatch,
      fallbackCustomer,
      fallbackSite,
      []
    );
    expect(mockProjectStatusUserPrompt).toHaveBeenCalledWith(
      "FORMATTED_DATA",
      "professional"
    );
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("uses service-closure prompt path for service-closure automation", async () => {
    const res = await POST(
      makeRequest({
        recordId: "DB-001",
        automationType: "service-closure",
        tone: "friendly",
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockServiceClosureSystemPrompt).toHaveBeenCalledTimes(1);
    expect(mockServiceClosureUserPrompt).toHaveBeenCalledWith(
      "FORMATTED_DATA",
      "friendly"
    );
    expect(mockProjectStatusSystemPrompt).not.toHaveBeenCalled();
  });

  it("returns 500 when stream generation fails", async () => {
    mockGenerateStream.mockRejectedValue(new Error("model unavailable"));

    const res = await POST(
      makeRequest({
        recordId: "DB-001",
        automationType: "project-status",
        tone: "professional",
      }) as never
    );

    expect(res.status).toBe(500);
    await expect(res.text()).resolves.toContain("Failed to generate email");
  });
});

