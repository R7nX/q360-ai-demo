import { getProjectProgress } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitValue = Number(searchParams.get("limit") ?? "12");
    const result = await getProjectProgress(
      Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 12,
    );

    return Response.json(result);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
