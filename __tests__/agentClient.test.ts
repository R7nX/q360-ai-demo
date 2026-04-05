import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these mocks are available when vi.mock() factory runs
// (vi.mock is hoisted above imports, so plain variables would be undefined)
const { mockGenerateContent, mockGenerateContentStream } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockGenerateContentStream: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return {
      models: {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      },
    };
  }),
}));

import { generateJSON, generateStream } from "@/lib/agentClient";

// ── generateJSON ──────────────────────────────────────────────────────────────

describe("generateJSON", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it("returns the text from the API response", async () => {
    mockGenerateContent.mockResolvedValue({ text: '{"result":"ok"}' });
    await expect(generateJSON("sys", "usr")).resolves.toBe('{"result":"ok"}');
  });

  it("returns an empty string when response.text is null", async () => {
    mockGenerateContent.mockResolvedValue({ text: null });
    await expect(generateJSON("sys", "usr")).resolves.toBe("");
  });

  it("passes systemInstruction in config", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateJSON("my system", "my prompt");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ systemInstruction: "my system" }),
      })
    );
  });

  it("uses default maxOutputTokens of 3000", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateJSON("sys", "usr");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ maxOutputTokens: 3000 }),
      })
    );
  });

  it("accepts a custom maxOutputTokens", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateJSON("sys", "usr", 8192);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ maxOutputTokens: 8192 }),
      })
    );
  });

  it("sends the user prompt as the message content", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateJSON("sys", "tell me about dispatches");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            parts: expect.arrayContaining([
              expect.objectContaining({ text: "tell me about dispatches" }),
            ]),
          }),
        ]),
      })
    );
  });

  it("propagates API errors", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Quota exceeded"));
    await expect(generateJSON("sys", "usr")).rejects.toThrow("Quota exceeded");
  });
});

// ── generateStream ────────────────────────────────────────────────────────────

async function* makeChunks(texts: (string | null | undefined)[]) {
  for (const text of texts) {
    yield { text };
  }
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe("generateStream", () => {
  beforeEach(() => {
    mockGenerateContentStream.mockReset();
  });

  it("returns a ReadableStream", async () => {
    mockGenerateContentStream.mockResolvedValue(makeChunks(["hi"]));
    const stream = await generateStream("sys", "usr");
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it("streams text chunks in order", async () => {
    mockGenerateContentStream.mockResolvedValue(
      makeChunks(["Hello ", "World"])
    );
    const stream = await generateStream("sys", "usr");
    await expect(readStream(stream)).resolves.toBe("Hello World");
  });

  it("skips null text chunks without error", async () => {
    mockGenerateContentStream.mockResolvedValue(
      makeChunks(["valid", null, "also valid"])
    );
    const stream = await generateStream("sys", "usr");
    await expect(readStream(stream)).resolves.toBe("validalso valid");
  });

  it("skips undefined text chunks without error", async () => {
    mockGenerateContentStream.mockResolvedValue(
      makeChunks([undefined, "text"])
    );
    const stream = await generateStream("sys", "usr");
    await expect(readStream(stream)).resolves.toBe("text");
  });

  it("emits an error message in the stream when generation throws mid-stream", async () => {
    async function* failingGen() {
      yield { text: "start" };
      throw new Error("Connection lost");
    }
    mockGenerateContentStream.mockResolvedValue(failingGen());
    const stream = await generateStream("sys", "usr");
    const result = await readStream(stream);
    expect(result).toContain("start");
    expect(result).toContain("[ERROR:");
    expect(result).toContain("Connection lost");
  });

  it("passes systemInstruction in config", async () => {
    mockGenerateContentStream.mockResolvedValue(makeChunks(["ok"]));
    await generateStream("my system prompt", "usr");
    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          systemInstruction: "my system prompt",
        }),
      })
    );
  });

  it("propagates errors from the initial API call", async () => {
    mockGenerateContentStream.mockRejectedValue(new Error("Auth failed"));
    await expect(generateStream("sys", "usr")).rejects.toThrow("Auth failed");
  });
});
