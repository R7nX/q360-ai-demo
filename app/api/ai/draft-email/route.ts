/**
 * POST /api/ai/draft-email
 *
 * Abstract, shared email drafting route owned by Team 2.
 * Teams 1 and 3 call this endpoint — do not modify the request/response
 * shape without coordinating with all teams.
 *
 * Supported intents: "project-status" | "service-closure" | "new-call-ack" | "overdue-alert"
 * Supported audiences: "customer" | "internal" | "manager" | "technician"
 */

import { NextRequest } from "next/server";
import { generateStream } from "@/lib/agentClient";
import {
  formatDispatchForPrompt,
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
  FALLBACK_SITES,
} from "@/lib/q360Client";
import {
  getDispatchByIdFromMockDb,
  getCustomerFromMockDb,
  getSiteFromMockDb,
} from "@/lib/mockDb";
import {
  projectStatusSystemPrompt,
  projectStatusUserPrompt,
  serviceClosureSystemPrompt,
  serviceClosureUserPrompt,
  overdueAlertSystemPrompt,
  overdueAlertUserPrompt,
  newCallAckSystemPrompt,
  newCallAckUserPrompt,
} from "@/lib/emailPrompts";
import type { ToneOption } from "@/types/feature2";

const SUPPORTED_INTENTS = [
  "project-status",
  "service-closure",
  "overdue-alert",
  "new-call-ack",
] as const;

type Intent = (typeof SUPPORTED_INTENTS)[number];

function isValidIntent(v: unknown): v is Intent {
  return SUPPORTED_INTENTS.includes(v as Intent);
}

function isValidTone(v: unknown): v is ToneOption {
  return v === "professional" || v === "friendly" || v === "concise";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const { entityType, entityId, intent, tone = "professional", audience } = body;

  if (!entityId || typeof entityId !== "string") {
    return new Response("entityId is required.", { status: 400 });
  }
  if (!isValidIntent(intent)) {
    return new Response(
      `Invalid intent. Supported: ${SUPPORTED_INTENTS.join(", ")}`,
      { status: 400 }
    );
  }
  if (!isValidTone(tone)) {
    return new Response(
      "Invalid tone. Supported: professional, friendly, concise",
      { status: 400 }
    );
  }

  // Currently only dispatch is supported — extend here as more entity types are added
  if (entityType && entityType !== "dispatch") {
    return new Response(
      `entityType "${entityType}" is not yet supported. Only "dispatch" is supported.`,
      { status: 400 }
    );
  }

  try {
    // ── Fetch entity data ──
    let dispatch = null;
    let customer = null;
    let site = null;

    dispatch = await getDispatchByIdFromMockDb(entityId);
    if (dispatch) {
      customer = await getCustomerFromMockDb(dispatch.customerno);
      site = await getSiteFromMockDb(dispatch.siteno);
    }
    if (!dispatch) {
      dispatch = FALLBACK_DISPATCHES.find((d) => d.dispatchno === entityId) ?? null;
      if (dispatch) {
        customer = FALLBACK_CUSTOMERS[dispatch.customerno] ?? null;
        site = FALLBACK_SITES[dispatch.siteno] ?? null;
      }
    }

    if (!dispatch) {
      return new Response(`Record ${entityId} not found.`, { status: 404 });
    }

    const formattedData = formatDispatchForPrompt(dispatch, customer, site);

    // Audience hint appended to formatted data so the AI can adjust framing
    const audienceHint = audience
      ? `\nIntended Audience: ${audience}`
      : "";

    // ── Select prompt based on intent ──
    let systemPrompt: string;
    let userPrompt: string;

    switch (intent) {
      case "project-status":
        systemPrompt = projectStatusSystemPrompt();
        userPrompt = projectStatusUserPrompt(formattedData + audienceHint, tone);
        break;
      case "service-closure":
        systemPrompt = serviceClosureSystemPrompt();
        userPrompt = serviceClosureUserPrompt(formattedData + audienceHint, tone);
        break;
      case "overdue-alert":
        systemPrompt = overdueAlertSystemPrompt();
        userPrompt = overdueAlertUserPrompt(formattedData + audienceHint, tone);
        break;
      case "new-call-ack":
        systemPrompt = newCallAckSystemPrompt();
        userPrompt = newCallAckUserPrompt(formattedData + audienceHint, tone);
        break;
    }

    const stream = await generateStream(systemPrompt, userPrompt);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("/api/ai/draft-email error:", error);
    return new Response("Failed to generate email. Please try again.", {
      status: 500,
    });
  }
}
