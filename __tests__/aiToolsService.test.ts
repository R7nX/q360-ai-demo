import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateJSON, mockResolveEntity } = vi.hoisted(() => ({
  mockGenerateJSON: vi.fn(),
  mockResolveEntity: vi.fn(),
}));

vi.mock("@/lib/agentClient", () => ({
  generateJSON: mockGenerateJSON,
  MODEL: "gemini-test-model",
}));

vi.mock("@/lib/entityResolver", () => ({
  resolveEntity: mockResolveEntity,
}));

import {
  generateRecommendationResult,
  generateSmartReplyResult,
  generateStatusReportResult,
  generateSummaryResult,
} from "@/lib/aiToolsService";

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveEntity.mockResolvedValue({
    entityType: "dispatch",
    entityId: "D-1",
    formatted: "FORMATTED_ENTITY",
    raw: {
      dispatch: {},
      customer: null,
      site: null,
      timeBills: [],
    },
  });
});

describe("aiToolsService", () => {
  it("generates summary with metadata", async () => {
    mockGenerateJSON.mockResolvedValue("Summary output");

    const result = await generateSummaryResult({
      entityType: "dispatch",
      entityId: "D-1",
      tone: "professional",
    });

    expect(mockResolveEntity).toHaveBeenCalledWith("dispatch", "D-1");
    expect(result).toEqual({
      success: true,
      result: {
        content: "Summary output",
        metadata: {
          model: "gemini-test-model",
          entityType: "dispatch",
          entityId: "D-1",
        },
      },
    });
  });

  it("status report requests includeTimeBills from resolver", async () => {
    mockGenerateJSON.mockResolvedValue("Status output");

    const result = await generateStatusReportResult({
      entityType: "dispatch",
      entityId: "D-2",
      tone: "friendly",
      intent: "status",
    });

    expect(mockResolveEntity).toHaveBeenCalledWith("dispatch", "D-2", {
      includeTimeBills: true,
    });
    expect(result.result?.content).toBe("Status output");
  });

  it("smart reply prompt includes inbound message", async () => {
    mockGenerateJSON.mockResolvedValue("Reply output");

    await generateSmartReplyResult({
      entityType: "dispatch",
      entityId: "D-3",
      tone: "concise",
      inboundMessage: "Any update?",
    });

    const [, userPrompt] = mockGenerateJSON.mock.calls[0];
    expect(userPrompt).toContain("Any update?");
  });

  it("recommendation parses JSON actions", async () => {
    mockGenerateJSON.mockResolvedValue(
      JSON.stringify({
        content: "Action summary",
        actions: [
          {
            action: "Call customer",
            priority: "HIGH",
            assignTo: "Dispatch",
            reasoning: "SLA at risk",
          },
        ],
      })
    );

    const result = await generateRecommendationResult({
      entityType: "dispatch",
      entityId: "D-4",
      tone: "professional",
    });

    expect(result.result?.content).toBe("Action summary");
    expect(result.result?.actions).toEqual([
      {
        action: "Call customer",
        priority: "HIGH",
        assignTo: "Dispatch",
        reasoning: "SLA at risk",
      },
    ]);
  });

  it("recommendation falls back when AI does not return JSON", async () => {
    mockGenerateJSON.mockResolvedValue("Not JSON output");

    const result = await generateRecommendationResult({
      entityType: "dispatch",
      entityId: "D-5",
      tone: "friendly",
    });

    expect(result.success).toBe(true);
    expect(result.result?.content).toBe("Not JSON output");
    expect(result.result?.actions).toEqual([]);
    expect(result.message).toContain("not valid JSON");
  });
});
