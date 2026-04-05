import { NextRequest } from "next/server";
import {
  normalizeAudience,
  normalizeEntityType,
  normalizeTone,
} from "@/lib/draftEmailService";
import { generateRecommendationResult } from "@/lib/aiToolsService";
import {
  EntityNotFoundError,
  UnsupportedEntityTypeError,
} from "@/lib/entityResolver";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, result: null, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const entityType = normalizeEntityType(body.entityType);
  if (!entityType) {
    return Response.json(
      { success: false, result: null, message: "Invalid entityType." },
      { status: 400 }
    );
  }

  const entityId = body.entityId;
  if (typeof entityId !== "string" || entityId.trim() === "") {
    return Response.json(
      { success: false, result: null, message: "entityId is required." },
      { status: 400 }
    );
  }

  const tone = normalizeTone(body.tone);
  if (!tone) {
    return Response.json(
      { success: false, result: null, message: "Invalid tone." },
      { status: 400 }
    );
  }

  const audienceRaw = body.audience;
  const audience = normalizeAudience(audienceRaw);
  if (audienceRaw != null && !audience) {
    return Response.json(
      { success: false, result: null, message: "Invalid audience." },
      { status: 400 }
    );
  }

  const context = isRecord(body.context) ? body.context : undefined;

  try {
    const response = await generateRecommendationResult({
      entityType,
      entityId,
      intent: typeof body.intent === "string" ? body.intent : undefined,
      tone,
      audience,
      context,
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof UnsupportedEntityTypeError) {
      return Response.json(
        { success: false, result: null, message: error.message },
        { status: 400 }
      );
    }
    if (error instanceof EntityNotFoundError) {
      return Response.json(
        { success: false, result: null, message: error.message },
        { status: 404 }
      );
    }

    console.error("/api/ai/recommend error:", error);
    return Response.json(
      {
        success: false,
        result: null,
        message: "Failed to generate recommendations. Please try again.",
      },
      { status: 500 }
    );
  }
}
