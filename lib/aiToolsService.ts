import { generateJSON, MODEL } from "@/lib/agentClient";
import { resolveEntity } from "@/lib/entityResolver";
import type { AiEntityType, AiToolResponse, ToneOption } from "@/types/feature2";

interface ToolInput {
  entityType: AiEntityType;
  entityId: string;
  intent?: string;
  tone: ToneOption;
  audience?: "manager" | "customer" | "technician" | "internal";
  context?: Record<string, unknown>;
}

interface ReplyInput extends ToolInput {
  inboundMessage: string;
}

const TONE_HINTS: Record<ToneOption, string> = {
  professional: "Use clear, professional business language.",
  friendly: "Use an approachable, supportive tone.",
  concise: "Keep it short, direct, and actionable.",
};

function createMetadata(entityType: AiEntityType, entityId: string) {
  return {
    model: MODEL,
    entityType,
    entityId,
  };
}

function formatContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) return "";
  return `\n\nAdditional Caller Context:\n${JSON.stringify(context, null, 2)}`;
}

function audienceHint(
  audience?: "manager" | "customer" | "technician" | "internal"
): string {
  if (!audience) return "";
  return `\nAudience: ${audience}`;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const stripped = stripFences(text);
  const jsonStart = stripped.indexOf("{");
  const jsonEnd = stripped.lastIndexOf("}");
  const cleaned =
    jsonStart !== -1 && jsonEnd !== -1
      ? stripped.slice(jsonStart, jsonEnd + 1)
      : stripped;

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function mapActions(value: unknown): Array<{
  action: string;
  priority: string;
  assignTo: string;
  reasoning: string;
}> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const action = asString(record.action).trim();
      if (!action) return null;
      return {
        action,
        priority: asString(record.priority, "MEDIUM"),
        assignTo: asString(record.assignTo, "Dispatch Team"),
        reasoning: asString(record.reasoning, "Follow-up recommended."),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function generateSummaryResult(
  input: ToolInput
): Promise<AiToolResponse> {
  const resolved = await resolveEntity(input.entityType, input.entityId);

  const systemPrompt = `You are an operations analyst for a field service company.
Provide a concise human-readable summary focused on business relevance.

Rules:
- Never fabricate data not shown.
- Highlight notable status, owner/technician, urgency, and next steps.
- Keep summary under 180 words.
- Use short paragraphs or bullet points.`;

  const userPrompt = `Summarize this entity for quick operational review.
Tone: ${TONE_HINTS[input.tone]}${audienceHint(input.audience)}
Intent: ${input.intent ?? "summary"}

Entity data:
${resolved.formatted}${formatContext(input.context)}`;

  const content = (await generateJSON(systemPrompt, userPrompt, 2048)).trim();

  return {
    success: true,
    result: {
      content,
      metadata: createMetadata(input.entityType, input.entityId),
    },
  };
}

export async function generateStatusReportResult(
  input: ToolInput
): Promise<AiToolResponse> {
  const resolved = await resolveEntity(input.entityType, input.entityId, {
    includeTimeBills: true,
  });

  const systemPrompt = `You write status reports for service operations leaders.
Return a structured status report with:
1) Current Status
2) Work Completed
3) Risks / Blockers
4) Recommended Next Steps

Rules:
- Use only provided data.
- Keep it actionable and specific.
- Keep total output under 250 words.`;

  const userPrompt = `Generate a status report.
Tone: ${TONE_HINTS[input.tone]}${audienceHint(input.audience)}
Intent: ${input.intent ?? "status-report"}

Entity data:
${resolved.formatted}${formatContext(input.context)}`;

  const content = (await generateJSON(systemPrompt, userPrompt, 3072)).trim();

  return {
    success: true,
    result: {
      content,
      metadata: createMetadata(input.entityType, input.entityId),
    },
  };
}

export async function generateSmartReplyResult(
  input: ReplyInput
): Promise<AiToolResponse> {
  const resolved = await resolveEntity(input.entityType, input.entityId);

  const systemPrompt = `You draft short, high-quality professional replies for field service communication.

Rules:
- Reply directly to the inbound message.
- Incorporate only facts from provided entity data and caller context.
- Do not invent commitments, dates, or technician promises.
- Keep output under 160 words.`;

  const userPrompt = `Draft a suggested reply to the inbound message.
Tone: ${TONE_HINTS[input.tone]}${audienceHint(input.audience)}
Intent: ${input.intent ?? "smart-reply"}

Inbound message:
${input.inboundMessage}

Entity data:
${resolved.formatted}${formatContext(input.context)}`;

  const content = (await generateJSON(systemPrompt, userPrompt, 2048)).trim();

  return {
    success: true,
    result: {
      content,
      metadata: createMetadata(input.entityType, input.entityId),
    },
  };
}

export async function generateRecommendationResult(
  input: ToolInput
): Promise<AiToolResponse> {
  const resolved = await resolveEntity(input.entityType, input.entityId);

  const systemPrompt = `You generate operational next-step recommendations for a field service team.

Return JSON only:
{
  "content": "<brief executive summary>",
  "actions": [
    {
      "action": "<what to do>",
      "priority": "CRITICAL | HIGH | MEDIUM | LOW",
      "assignTo": "<team or role>",
      "reasoning": "<single sentence rationale>"
    }
  ]
}

Rules:
- Recommend 3 to 5 actions.
- Never fabricate unavailable details.
- Prioritize customer impact and SLA risk.`;

  const userPrompt = `Recommend next actions.
Tone: ${TONE_HINTS[input.tone]}${audienceHint(input.audience)}
Intent: ${input.intent ?? "recommend"}

Entity data:
${resolved.formatted}${formatContext(input.context)}`;

  const rawText = await generateJSON(systemPrompt, userPrompt, 4096);
  const parsed = parseJsonObject(rawText);

  if (!parsed) {
    const fallbackContent = stripFences(rawText);
    return {
      success: true,
      result: {
        content: fallbackContent,
        actions: [],
        metadata: createMetadata(input.entityType, input.entityId),
      },
      message:
        "AI response was not valid JSON; returned raw recommendation text only.",
    };
  }

  return {
    success: true,
    result: {
      content: asString(parsed.content, stripFences(rawText)),
      actions: mapActions(parsed.actions),
      metadata: createMetadata(input.entityType, input.entityId),
    },
  };
}
