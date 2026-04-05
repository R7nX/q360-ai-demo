/**
 * POST /api/feature2/generate — streams an automation email (project status, closure, overdue, etc.)
 * for a selected dispatch using Feature 2 types and draft-email plumbing.
 */
import { NextRequest } from "next/server";
import {
  generateDraftStream,
  normalizeIntent,
  normalizeTone,
  SUPPORTED_EMAIL_INTENTS,
} from "@/lib/draftEmailService";
import {
  EntityNotFoundError,
  UnsupportedEntityTypeError,
} from "@/lib/entityResolver";
import type { GenerateRequest } from "@/types/feature2";

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body. Please check your request.", {
      status: 400,
    });
  }

  const { recordId, automationType, tone } = body;

  if (!recordId || !tone) {
    return new Response(
      "recordId and tone are required. Please check your request.",
      { status: 400 }
    );
  }

  const intent = normalizeIntent(automationType);
  if (!intent) {
    return new Response(
      `Unsupported automation type: ${automationType}. Supported: ${SUPPORTED_EMAIL_INTENTS.join(", ")}`,
      { status: 400 }
    );
  }

  const normalizedTone = normalizeTone(tone);
  if (!normalizedTone) {
    return new Response(
      "Invalid tone. Supported: professional, friendly, concise",
      { status: 400 }
    );
  }

  try {
    const stream = await generateDraftStream({
      entityType: "dispatch",
      entityId: recordId,
      intent,
      tone: normalizedTone,
      includeTimeBills: true,
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
      return new Response(`Dispatch ${recordId} not found`, { status: 404 });
    }

    console.error("Generate endpoint error:", error);
    return new Response("Failed to generate email. Please try again.", {
      status: 500,
    });
  }
}
