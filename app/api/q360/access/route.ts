import { getDatasourceAccessList } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userid") ?? undefined;
    const sources = await getDatasourceAccessList(userId);

    return Response.json({
      count: sources.length,
      sources,
      userId: userId ?? process.env.Q360_API_USER ?? null,
    });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
