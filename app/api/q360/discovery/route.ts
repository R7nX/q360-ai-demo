import { getPhase0DiscoverySummary } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSchemas = searchParams.get("includeSchemas") !== "false";
    const userId = searchParams.get("userid") ?? undefined;

    const summary = await getPhase0DiscoverySummary({
      includeSchemas,
      userId,
    });

    return Response.json(summary);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
