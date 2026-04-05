import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockNormalizeEntityType,
  mockNormalizeTone,
  mockNormalizeAudience,
  mockGenerateSummaryResult,
  mockGenerateRecommendationResult,
  mockGenerateStatusReportResult,
  mockGenerateSmartReplyResult,
  MockEntityNotFoundError,
  MockUnsupportedEntityTypeError,
} = vi.hoisted(() => {
  class MockEntityNotFoundError extends Error {}
  class MockUnsupportedEntityTypeError extends Error {}

  return {
    mockNormalizeEntityType: vi.fn(),
    mockNormalizeTone: vi.fn(),
    mockNormalizeAudience: vi.fn(),
    mockGenerateSummaryResult: vi.fn(),
    mockGenerateRecommendationResult: vi.fn(),
    mockGenerateStatusReportResult: vi.fn(),
    mockGenerateSmartReplyResult: vi.fn(),
    MockEntityNotFoundError,
    MockUnsupportedEntityTypeError,
  };
});

vi.mock("@/lib/draftEmailService", () => ({
  normalizeEntityType: mockNormalizeEntityType,
  normalizeTone: mockNormalizeTone,
  normalizeAudience: mockNormalizeAudience,
}));

vi.mock("@/lib/aiToolsService", () => ({
  generateSummaryResult: mockGenerateSummaryResult,
  generateRecommendationResult: mockGenerateRecommendationResult,
  generateStatusReportResult: mockGenerateStatusReportResult,
  generateSmartReplyResult: mockGenerateSmartReplyResult,
}));

vi.mock("@/lib/entityResolver", () => ({
  EntityNotFoundError: MockEntityNotFoundError,
  UnsupportedEntityTypeError: MockUnsupportedEntityTypeError,
}));

import { POST as summarizePOST } from "@/app/api/ai/summarize/route";
import { POST as recommendPOST } from "@/app/api/ai/recommend/route";
import { POST as statusPOST } from "@/app/api/ai/status-report/route";
import { POST as smartReplyPOST } from "@/app/api/ai/smart-reply/route";

function makeRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockNormalizeEntityType.mockReturnValue("dispatch");
  mockNormalizeTone.mockReturnValue("professional");
  mockNormalizeAudience.mockImplementation((v) => v ?? undefined);

  mockGenerateSummaryResult.mockResolvedValue({
    success: true,
    result: { content: "summary", metadata: {} },
  });
  mockGenerateRecommendationResult.mockResolvedValue({
    success: true,
    result: { content: "recommend", actions: [], metadata: {} },
  });
  mockGenerateStatusReportResult.mockResolvedValue({
    success: true,
    result: { content: "status", metadata: {} },
  });
  mockGenerateSmartReplyResult.mockResolvedValue({
    success: true,
    result: { content: "reply", metadata: {} },
  });
});

describe("shared AI routes", () => {
  it("summarize returns 400 when entityType is invalid", async () => {
    mockNormalizeEntityType.mockReturnValueOnce(null);

    const res = await summarizePOST(
      makeRequest("http://localhost/api/ai/summarize", {
        entityType: "bad",
        entityId: "D-1",
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain("Invalid entityType");
    expect(mockGenerateSummaryResult).not.toHaveBeenCalled();
  });

  it("summarize success passes validated payload to service", async () => {
    const res = await summarizePOST(
      makeRequest("http://localhost/api/ai/summarize", {
        entityType: "dispatch",
        entityId: "D-1",
        intent: "summary",
        tone: "professional",
        audience: "internal",
        context: { a: 1 },
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGenerateSummaryResult).toHaveBeenCalledWith({
      entityType: "dispatch",
      entityId: "D-1",
      intent: "summary",
      tone: "professional",
      audience: "internal",
      context: { a: 1 },
    });
  });

  it("recommend returns 500 for unexpected errors", async () => {
    mockGenerateRecommendationResult.mockRejectedValueOnce(new Error("boom"));

    const res = await recommendPOST(
      makeRequest("http://localhost/api/ai/recommend", {
        entityType: "dispatch",
        entityId: "D-2",
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toContain("Failed to generate recommendations");
  });

  it("status-report maps EntityNotFoundError to 404", async () => {
    mockGenerateStatusReportResult.mockRejectedValueOnce(
      new MockEntityNotFoundError("not found")
    );

    const res = await statusPOST(
      makeRequest("http://localhost/api/ai/status-report", {
        entityType: "dispatch",
        entityId: "D-3",
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toContain("not found");
  });

  it("smart-reply returns 400 when inbound message is missing", async () => {
    const res = await smartReplyPOST(
      makeRequest("http://localhost/api/ai/smart-reply", {
        entityType: "dispatch",
        entityId: "D-4",
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain("inboundMessage is required");
    expect(mockGenerateSmartReplyResult).not.toHaveBeenCalled();
  });

  it("smart-reply accepts inbound message from context", async () => {
    const res = await smartReplyPOST(
      makeRequest("http://localhost/api/ai/smart-reply", {
        entityType: "dispatch",
        entityId: "D-5",
        context: { inboundMessage: "Any updates?" },
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGenerateSmartReplyResult).toHaveBeenCalledWith(
      expect.objectContaining({
        inboundMessage: "Any updates?",
      })
    );
  });
});
