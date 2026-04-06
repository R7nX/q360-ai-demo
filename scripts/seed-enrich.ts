/**
 * seed-enrich.ts
 *
 * Optional Gemini-powered text enrichment for profile-generated seed rows.
 * Gated behind SEED_USE_GEMINI=true. Falls back to original text on any failure.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnrichableRow = Record<string, unknown>;

export interface EnrichmentContext {
  enabled: boolean;
  geminiCall: (systemPrompt: string, userPrompt: string) => Promise<string>;
  budgetCap: number;
  batchSize: number;
  /** Tracks calls consumed so far (mutated across enrichRows calls). */
  callsUsed: number;
}

export interface EnrichmentOptions {
  enabled: boolean;
  geminiCall?: EnrichmentContext["geminiCall"];
  budgetCap?: number;
  batchSize?: number;
}

// ── System Prompts ────────────────────────────────────────────────────────────

const TABLE_PROMPTS: Record<string, string> = {
  MACHINE: "You generate realistic equipment descriptions for a field service management system. Equipment includes HVAC units, generators, elevators, pumps, and electrical panels installed at commercial sites.",
  DISPATCH: "You generate realistic service dispatch descriptions for a field service management system. Dispatches cover HVAC, electrical, plumbing, elevator, fire safety, and general maintenance issues.",
  EMPSCHEDULE: "You generate realistic schedule entry titles for field service technicians. Entries describe on-site service work, inspections, preventive maintenance, and travel.",
  PROJECTSCHEDULE: "You generate realistic project phase titles for facility upgrade and maintenance projects. Phases include planning, procurement, installation, QA, and closeout.",
  PROJECTTASKHISTORY: "You generate realistic change-log notes for project task state transitions in a field service management system.",
};

function getSystemPrompt(tableName: string): string {
  return TABLE_PROMPTS[tableName] ?? "You generate realistic text for a field service management system.";
}

// ── Context Factory ───────────────────────────────────────────────────────────

export function createEnrichmentContext(options: EnrichmentOptions): EnrichmentContext {
  return {
    enabled: options.enabled,
    geminiCall: options.geminiCall ?? defaultGeminiCall,
    budgetCap: options.budgetCap ?? 50,
    batchSize: options.batchSize ?? 10,
    callsUsed: 0,
  };
}

/** Default Gemini caller using the project's existing agentClient. */
async function defaultGeminiCall(systemPrompt: string, userPrompt: string): Promise<string> {
  const { generateJSON } = await import("../lib/agentClient");
  return generateJSON(systemPrompt, userPrompt, 2000);
}

// ── Core Enrichment ───────────────────────────────────────────────────────────

export async function enrichRows(
  tableName: string,
  rows: EnrichableRow[],
  fields: string[],
  ctx: EnrichmentContext
): Promise<EnrichableRow[]> {
  if (!ctx.enabled || rows.length === 0) return rows;

  // Clone rows so we don't mutate originals
  const result = rows.map((r) => ({ ...r }));

  for (const field of fields) {
    await enrichField(tableName, result, field, ctx);
  }

  return result;
}

async function enrichField(
  tableName: string,
  rows: EnrichableRow[],
  field: string,
  ctx: EnrichmentContext
): Promise<void> {
  // Collect indices of rows that have non-null values for this field
  const enrichable: { index: number; value: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const val = rows[i][field];
    if (val != null) {
      enrichable.push({ index: i, value: String(val) });
    }
  }

  if (enrichable.length === 0) return;

  // Process in batches
  for (let batchStart = 0; batchStart < enrichable.length; batchStart += ctx.batchSize) {
    if (ctx.callsUsed >= ctx.budgetCap) break;

    const batch = enrichable.slice(batchStart, batchStart + ctx.batchSize);
    const inputValues = batch.map((b) => b.value);

    try {
      const systemPrompt = getSystemPrompt(tableName);
      const userPrompt = `Enrich these ${field.toLowerCase()} values into more detailed, realistic text. Return a JSON array of strings, one per input, in the same order. Do not add markdown formatting.\nInput: ${JSON.stringify(inputValues)}`;

      ctx.callsUsed++;
      const response = await ctx.geminiCall(systemPrompt, userPrompt);

      // Parse response
      let enriched: unknown;
      try {
        enriched = JSON.parse(response);
      } catch {
        // Malformed JSON → skip this batch
        continue;
      }

      if (!Array.isArray(enriched) || enriched.length !== batch.length) {
        // Wrong array length → skip this batch
        continue;
      }

      // Apply enriched values
      for (let i = 0; i < batch.length; i++) {
        const enrichedValue = enriched[i];
        if (typeof enrichedValue === "string" && enrichedValue.length > 0) {
          rows[batch[i].index][field] = enrichedValue;
        }
      }
    } catch {
      // Gemini call failed → keep original text for this batch
      continue;
    }
  }
}
