/**
 * POST /api/ai/draft-email — generates customer-facing email drafts from Q360 entity context.
 * Supports JSON responses or streamed text for the email drafter UI.
 */
import { NextRequest } from "next/server";
import {
  generateDraftJson,
  generateDraftStream,
  normalizeAudience,
  normalizeEntityType,
  normalizeIntent,
  normalizeTone,
  SUPPORTED_EMAIL_INTENTS,
} from "@/lib/draftEmailService";
import {
  EntityNotFoundError,
  UnsupportedEntityTypeError,
} from "@/lib/entityResolver";

const SUPPORTED_TONES = [
  "professional",
  "friendly",
  "concise",
  "formal",
  "urgent",
] as const;

export async function POST(request: NextRequest | Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const entityType = normalizeEntityType(body.entityType);
  if (!entityType) {
    return new Response('Invalid entityType. Supported: "dispatch".', {
      status: 400,
    });
  }

  const entityId = body.entityId;
  if (typeof entityId !== "string" || entityId.trim() === "") {
    return new Response("entityId is required.", { status: 400 });
  }

  const intent = normalizeIntent(body.intent);
  if (!intent) {
    return new Response(
      `Invalid intent. Supported: ${SUPPORTED_EMAIL_INTENTS.join(", ")}`,
      { status: 400 }
    );
  }

  const tone = normalizeTone(body.tone);
  if (!tone) {
    return new Response(
      `Invalid tone. Supported: ${SUPPORTED_TONES.join(", ")}`,
      { status: 400 }
    );
  }

  const audienceRaw = body.audience;
  const audience = normalizeAudience(audienceRaw);
  if (audienceRaw != null && !audience) {
    return new Response(
      'Invalid audience. Supported: "customer", "internal", "manager", "technician".',
      { status: 400 }
    );
  }

  const format =
    "nextUrl" in request
      ? request.nextUrl.searchParams.get("format")
      : new URL(request.url).searchParams.get("format");

  try {
    if (format === "json") {
      const payload = await generateDraftJson({
        entityType,
        entityId,
        intent,
        tone,
        audience,
      });
      return Response.json(payload);
    }

    const stream = await generateDraftStream({
      entityType,
      entityId,
      intent,
      tone,
      audience,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof UnsupportedEntityTypeError) {
      return new Response(error.message, { status: 400 });
    }
    if (error instanceof EntityNotFoundError) {
      return new Response(error.message, { status: 404 });
    }

    console.error("/api/ai/draft-email error:", error);
    return new Response("Failed to generate email. Please try again.", {
      status: 500,
    });
  }
}
