import { getProjectDetails } from "@/lib/q360/business-read";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitValue = Number(searchParams.get("limit") ?? "10");
    const result = await getProjectDetails(
      Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 10,
    );

    return Response.json(result);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
