/**
 * Tests for seed-enrich.ts — Phase 5 Gemini enrichment module.
 *
 * Uses a fake Gemini client to test batching, budget caps, fallback, and flag gating.
 */
import { describe, expect, it, vi } from "vitest";

// These imports will fail until seed-enrich.ts is implemented.
import {
  enrichRows,
  createEnrichmentContext,
  type EnrichmentContext,
  type EnrichableRow,
} from "../../scripts/seed-enrich";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRows(count: number, base: Partial<EnrichableRow> = {}): EnrichableRow[] {
  return Array.from({ length: count }, (_, i) => ({
    DESCRIPTION: `Template description ${i + 1}`,
    ...base,
  }));
}

/** Creates a fake Gemini caller that returns predictable enriched text. */
function fakeGeminiCaller(prefix = "enriched"): EnrichmentContext["geminiCall"] {
  return vi.fn(async (_system: string, _user: string): Promise<string> => {
    // Parse the input count from the prompt and return a JSON array of enriched strings.
    const match = _user.match(/\[([^\]]*)\]/);
    if (!match) return "[]";
    const inputs = JSON.parse(`[${match[1]}]`) as string[];
    return JSON.stringify(inputs.map((s: string) => `${prefix}: ${s}`));
  });
}

/** Creates a fake Gemini caller that always throws. */
function failingGeminiCaller(): EnrichmentContext["geminiCall"] {
  return vi.fn(async (): Promise<string> => {
    throw new Error("Gemini API unavailable");
  });
}

// ── Flag Gating ───────────────────────────────────────────────────────────────

describe("seed-enrich: flag gating", () => {
  it("returns rows unchanged when enrichment is disabled", async () => {
    const rows = makeRows(3);
    const ctx = createEnrichmentContext({ enabled: false });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);
    expect(result).toEqual(rows);
  });

  it("enriches rows when enabled", async () => {
    const rows = makeRows(2);
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);
    expect(result[0].DESCRIPTION).toMatch(/^enriched:/);
    expect(result[1].DESCRIPTION).toMatch(/^enriched:/);
    expect(caller).toHaveBeenCalled();
  });
});

// ── Batching ──────────────────────────────────────────────────────────────────

describe("seed-enrich: batching", () => {
  it("batches rows into groups to minimize API calls", async () => {
    const rows = makeRows(25);
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50, batchSize: 10 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    // 25 rows / 10 per batch = 3 calls
    expect(caller).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(25);
    expect(result[0].DESCRIPTION).toMatch(/^enriched:/);
    expect(result[24].DESCRIPTION).toMatch(/^enriched:/);
  });

  it("handles single-row batches", async () => {
    const rows = makeRows(1);
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);
    expect(caller).toHaveBeenCalledTimes(1);
    expect(result[0].DESCRIPTION).toMatch(/^enriched:/);
  });
});

// ── Budget Cap ────────────────────────────────────────────────────────────────

describe("seed-enrich: budget cap", () => {
  it("stops calling Gemini after budget is exhausted", async () => {
    const rows = makeRows(30);
    const caller = fakeGeminiCaller();
    // Budget of 2 calls, batch size 10 → only first 2 batches get enriched
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 2, batchSize: 10 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    expect(caller).toHaveBeenCalledTimes(2);
    // First 20 rows enriched, last 10 keep original text
    expect(result[0].DESCRIPTION).toMatch(/^enriched:/);
    expect(result[19].DESCRIPTION).toMatch(/^enriched:/);
    expect(result[20].DESCRIPTION).toBe("Template description 21");
    expect(result[29].DESCRIPTION).toBe("Template description 30");
  });

  it("tracks budget across multiple enrichRows calls on same context", async () => {
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 3, batchSize: 5 });

    // First call: 10 rows / 5 per batch = 2 calls → budget remaining: 1
    await enrichRows("MACHINE", makeRows(10), ["DESCRIPTION"], ctx);
    expect(caller).toHaveBeenCalledTimes(2);

    // Second call: 10 rows / 5 per batch → only 1 call allowed by budget
    await enrichRows("EMPSCHEDULE", makeRows(10, { TITLE: "Block" }), ["TITLE"], ctx);
    expect(caller).toHaveBeenCalledTimes(3);
  });
});

// ── Fallback on Failure ───────────────────────────────────────────────────────

describe("seed-enrich: fallback on failure", () => {
  it("keeps original text when Gemini call fails", async () => {
    const rows = makeRows(3);
    const caller = failingGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    // Should not throw, rows unchanged
    expect(result[0].DESCRIPTION).toBe("Template description 1");
    expect(result[2].DESCRIPTION).toBe("Template description 3");
  });

  it("keeps original text when Gemini returns malformed JSON", async () => {
    const caller = vi.fn(async () => "not valid json at all");
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const rows = makeRows(3);
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    expect(result[0].DESCRIPTION).toBe("Template description 1");
  });

  it("keeps original text when Gemini returns wrong array length", async () => {
    const caller = vi.fn(async () => JSON.stringify(["only one"]));
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const rows = makeRows(5);
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    // Mismatch → all originals preserved
    expect(result[0].DESCRIPTION).toBe("Template description 1");
    expect(result[4].DESCRIPTION).toBe("Template description 5");
  });
});

// ── Multiple Fields ───────────────────────────────────────────────────────────

describe("seed-enrich: multiple fields", () => {
  it("enriches multiple fields on the same rows", async () => {
    const rows: EnrichableRow[] = [
      { PROBLEM: "Template problem", SOLUTION: "Template solution" },
      { PROBLEM: "Another problem", SOLUTION: "Another solution" },
    ];
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("DISPATCH", rows, ["PROBLEM", "SOLUTION"], ctx);

    expect(result[0].PROBLEM).toMatch(/^enriched:/);
    expect(result[0].SOLUTION).toMatch(/^enriched:/);
    // One call per field = 2 calls
    expect(caller).toHaveBeenCalledTimes(2);
  });
});

// ── Empty Input ───────────────────────────────────────────────────────────────

describe("seed-enrich: edge cases", () => {
  it("handles empty row array without calling Gemini", async () => {
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("MACHINE", [], ["DESCRIPTION"], ctx);
    expect(result).toEqual([]);
    expect(caller).not.toHaveBeenCalled();
  });

  it("handles rows where target field is null", async () => {
    const rows: EnrichableRow[] = [{ DESCRIPTION: null }, { DESCRIPTION: "Has value" }];
    const caller = fakeGeminiCaller();
    const ctx = createEnrichmentContext({ enabled: true, geminiCall: caller, budgetCap: 50 });
    const result = await enrichRows("MACHINE", rows, ["DESCRIPTION"], ctx);

    // Null fields should be skipped, non-null enriched
    expect(result[0].DESCRIPTION).toBeNull();
    expect(result[1].DESCRIPTION).toMatch(/^enriched:/);
  });
});
