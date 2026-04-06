/**
 * Unit tests for `lib/draftEmailService` (streaming vs JSON, intent/tone normalization, mocks).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGenerateStream,
  mockGenerateJSON,
  mockResolveEntity,
  mockProjectStatusSystemPrompt,
  mockProjectStatusUserPrompt,
  mockServiceClosureSystemPrompt,
  mockServiceClosureUserPrompt,
  mockOverdueAlertSystemPrompt,
  mockOverdueAlertUserPrompt,
  mockNewCallAckSystemPrompt,
  mockNewCallAckUserPrompt,
} = vi.hoisted(() => ({
  mockGenerateStream: vi.fn(),
  mockGenerateJSON: vi.fn(),
  mockResolveEntity: vi.fn(),
  mockProjectStatusSystemPrompt: vi.fn(),
  mockProjectStatusUserPrompt: vi.fn(),
  mockServiceClosureSystemPrompt: vi.fn(),
  mockServiceClosureUserPrompt: vi.fn(),
  mockOverdueAlertSystemPrompt: vi.fn(),
  mockOverdueAlertUserPrompt: vi.fn(),
  mockNewCallAckSystemPrompt: vi.fn(),
  mockNewCallAckUserPrompt: vi.fn(),
}));

vi.mock("@/lib/agentClient", () => ({
  generateStream: mockGenerateStream,
  generateJSON: mockGenerateJSON,
  MODEL: "gemini-test-model",
}));

vi.mock("@/lib/entityResolver", () => ({
  resolveEntity: mockResolveEntity,
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

import {
  generateDraftJson,
  generateDraftStream,
  normalizeAudience,
  normalizeEntityType,
  normalizeIntent,
  normalizeTone,
} from "@/lib/draftEmailService";

beforeEach(() => {
  vi.resetAllMocks();

  mockResolveEntity.mockResolvedValue({
    entityType: "dispatch",
    entityId: "D-1",
    formatted: "FORMATTED_DATA",
    raw: {
      dispatch: {},
      customer: null,
      site: null,
      timeBills: [],
    },
  });

  mockProjectStatusSystemPrompt.mockReturnValue("SYS_PROJECT");
  mockProjectStatusUserPrompt.mockReturnValue("USER_PROJECT");
  mockServiceClosureSystemPrompt.mockReturnValue("SYS_CLOSURE");
  mockServiceClosureUserPrompt.mockReturnValue("USER_CLOSURE");
  mockOverdueAlertSystemPrompt.mockReturnValue("SYS_OVERDUE");
  mockOverdueAlertUserPrompt.mockReturnValue("USER_OVERDUE");
  mockNewCallAckSystemPrompt.mockReturnValue("SYS_ACK");
  mockNewCallAckUserPrompt.mockReturnValue("USER_ACK");
});

describe("draftEmailService normalizers", () => {
  it("normalizes entity type with dispatch default", () => {
    expect(normalizeEntityType(undefined)).toBe("dispatch");
    expect(normalizeEntityType("dispatch")).toBe("dispatch");
    expect(normalizeEntityType("project")).toBeNull();
    expect(normalizeEntityType("nope")).toBeNull();
  });

  it("normalizes intent aliases", () => {
    expect(normalizeIntent("status_update")).toBe("project-status");
    expect(normalizeIntent("completion_notice")).toBe("service-closure");
    expect(normalizeIntent("new_call_ack")).toBe("new-call-ack");
    expect(normalizeIntent("invalid")).toBeNull();
  });

  it("normalizes tone aliases", () => {
    expect(normalizeTone(undefined)).toBe("professional");
    expect(normalizeTone("formal")).toBe("professional");
    expect(normalizeTone("urgent")).toBe("concise");
    expect(normalizeTone("nonsense")).toBeNull();
  });

  it("normalizes audience values", () => {
    expect(normalizeAudience(undefined)).toBeUndefined();
    expect(normalizeAudience("customer")).toBe("customer");
    expect(normalizeAudience("invalid")).toBeUndefined();
  });
});

describe("generateDraftStream", () => {
  it("resolves entity and generates stream with audience hint", async () => {
    const stream = new ReadableStream<Uint8Array>();
    mockGenerateStream.mockResolvedValue(stream);

    const result = await generateDraftStream({
      entityType: "dispatch",
      entityId: "D-1",
      intent: "project-status",
      tone: "professional",
      audience: "internal",
      includeTimeBills: true,
    });

    expect(result).toBe(stream);
    expect(mockResolveEntity).toHaveBeenCalledWith("dispatch", "D-1", {
      includeTimeBills: true,
    });
    expect(mockProjectStatusUserPrompt).toHaveBeenCalledWith(
      "FORMATTED_DATA\nIntended Audience: internal",
      "professional"
    );
    expect(mockGenerateStream).toHaveBeenCalledWith("SYS_PROJECT", "USER_PROJECT");
  });
});

describe("generateDraftJson", () => {
  it("parses subject and body from SUBJECT format", async () => {
    mockGenerateJSON.mockResolvedValue("SUBJECT: Hello\n\nBody text");

    const result = await generateDraftJson({
      entityType: "dispatch",
      entityId: "D-1",
      intent: "service-closure",
      tone: "friendly",
    });

    expect(mockServiceClosureUserPrompt).toHaveBeenCalledWith(
      "FORMATTED_DATA",
      "friendly"
    );
    expect(result).toEqual({
      success: true,
      result: {
        content: "Body text",
        subject: "Hello",
        metadata: {
          model: "gemini-test-model",
          entityType: "dispatch",
          entityId: "D-1",
        },
      },
    });
  });

  it("returns full content when no subject header exists", async () => {
    mockGenerateJSON.mockResolvedValue("Plain body only");

    const result = await generateDraftJson({
      entityType: "dispatch",
      entityId: "D-2",
      intent: "new-call-ack",
      tone: "concise",
    });

    expect(result.result?.subject).toBeUndefined();
    expect(result.result?.content).toBe("Plain body only");
  });
});
