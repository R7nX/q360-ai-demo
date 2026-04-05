import { generateJSON, generateStream, MODEL } from "@/lib/agentClient";
import { resolveEntity } from "@/lib/entityResolver";
import {
  newCallAckSystemPrompt,
  newCallAckUserPrompt,
  overdueAlertSystemPrompt,
  overdueAlertUserPrompt,
  projectStatusSystemPrompt,
  projectStatusUserPrompt,
  serviceClosureSystemPrompt,
  serviceClosureUserPrompt,
} from "@/lib/emailPrompts";
import type { AiEntityType, AiToolResponse, ToneOption } from "@/types/feature2";

const SUPPORTED_ENTITY_TYPES = [
  "dispatch",
  "project",
  "customer",
  "servicecontract",
  "timebill",
] as const;

const SUPPORTED_AUDIENCES = [
  "customer",
  "internal",
  "manager",
  "technician",
] as const;

export const SUPPORTED_EMAIL_INTENTS = [
  "project-status",
  "service-closure",
  "overdue-alert",
  "new-call-ack",
] as const;

type SupportedAudience = (typeof SUPPORTED_AUDIENCES)[number];
type SupportedEmailIntent = (typeof SUPPORTED_EMAIL_INTENTS)[number];

type RouteTone = ToneOption | "formal" | "urgent";

const INTENT_ALIASES: Record<string, SupportedEmailIntent> = {
  "project-status": "project-status",
  status_update: "project-status",
  "status-update": "project-status",

  "service-closure": "service-closure",
  completion_notice: "service-closure",
  "completion-notice": "service-closure",

  "overdue-alert": "overdue-alert",
  overdue_alert: "overdue-alert",
  "overdue-alert-internal": "overdue-alert",

  "new-call-ack": "new-call-ack",
  new_call_ack: "new-call-ack",
  "new-call-acknowledgement": "new-call-ack",
};

const TONE_ALIASES: Record<string, ToneOption> = {
  professional: "professional",
  formal: "professional",
  friendly: "friendly",
  concise: "concise",
  urgent: "concise",
};

export interface DraftEmailInput {
  entityType: AiEntityType;
  entityId: string;
  intent: SupportedEmailIntent;
  tone: ToneOption;
  audience?: SupportedAudience;
  includeTimeBills?: boolean;
}

interface SplitDraft {
  subject?: string;
  content: string;
}

export function normalizeEntityType(value: unknown): AiEntityType | null {
  if (value == null) return "dispatch";
  if (typeof value !== "string") return null;
  if (!SUPPORTED_ENTITY_TYPES.includes(value as AiEntityType)) return null;
  return value as AiEntityType;
}

export function normalizeIntent(value: unknown): SupportedEmailIntent | null {
  if (typeof value !== "string") return null;
  return INTENT_ALIASES[value] ?? null;
}

export function normalizeAudience(value: unknown): SupportedAudience | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") return undefined;
  if (SUPPORTED_AUDIENCES.includes(value as SupportedAudience)) {
    return value as SupportedAudience;
  }
  return undefined;
}

export function normalizeTone(value: unknown): ToneOption | null {
  if (value == null) return "professional";
  if (typeof value !== "string") return null;
  return TONE_ALIASES[value as RouteTone] ?? null;
}

function buildPrompts(input: {
  intent: SupportedEmailIntent;
  tone: ToneOption;
  audience?: SupportedAudience;
  formatted: string;
}): {
  systemPrompt: string;
  userPrompt: string;
} {
  const audienceHint = input.audience
    ? `\nIntended Audience: ${input.audience}`
    : "";

  switch (input.intent) {
    case "project-status":
      return {
        systemPrompt: projectStatusSystemPrompt(),
        userPrompt: projectStatusUserPrompt(
          input.formatted + audienceHint,
          input.tone
        ),
      };
    case "service-closure":
      return {
        systemPrompt: serviceClosureSystemPrompt(),
        userPrompt: serviceClosureUserPrompt(
          input.formatted + audienceHint,
          input.tone
        ),
      };
    case "overdue-alert":
      return {
        systemPrompt: overdueAlertSystemPrompt(),
        userPrompt: overdueAlertUserPrompt(
          input.formatted + audienceHint,
          input.tone
        ),
      };
    case "new-call-ack":
      return {
        systemPrompt: newCallAckSystemPrompt(),
        userPrompt: newCallAckUserPrompt(input.formatted + audienceHint, input.tone),
      };
  }
}

function splitDraftText(text: string): SplitDraft {
  const normalized = text.trim();
  if (!normalized) return { content: "" };

  const subjectAndBody = normalized.match(
    /^SUBJECT:\s*(.+?)\r?\n\r?\n([\s\S]*)$/i
  );
  if (subjectAndBody) {
    return {
      subject: subjectAndBody[1].trim(),
      content: subjectAndBody[2].trim(),
    };
  }

  const subjectOnly = normalized.match(/^SUBJECT:\s*(.+)$/i);
  if (subjectOnly) {
    return {
      subject: subjectOnly[1].trim(),
      content: "",
    };
  }

  return { content: normalized };
}

export async function generateDraftStream(
  input: DraftEmailInput
): Promise<ReadableStream<Uint8Array>> {
  const resolved = await resolveEntity(input.entityType, input.entityId, {
    includeTimeBills: input.includeTimeBills,
  });
  const prompts = buildPrompts({
    intent: input.intent,
    tone: input.tone,
    audience: input.audience,
    formatted: resolved.formatted,
  });
  return generateStream(prompts.systemPrompt, prompts.userPrompt);
}

export async function generateDraftJson(
  input: DraftEmailInput
): Promise<AiToolResponse> {
  const resolved = await resolveEntity(input.entityType, input.entityId, {
    includeTimeBills: input.includeTimeBills,
  });
  const prompts = buildPrompts({
    intent: input.intent,
    tone: input.tone,
    audience: input.audience,
    formatted: resolved.formatted,
  });
  const text = await generateJSON(prompts.systemPrompt, prompts.userPrompt, 4096);
  const split = splitDraftText(text);

  return {
    success: true,
    result: {
      content: split.content,
      subject: split.subject,
      metadata: {
        model: MODEL,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
  };
}
