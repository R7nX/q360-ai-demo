import { getBusinessOverview } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const runtime = "nodejs";
export const revalidate = 30;

function parseOptionalLimit(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? Math.floor(parsedValue)
    : fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const overview = await getBusinessOverview({
      agendaLimit: parseOptionalLimit(searchParams.get("agendaLimit"), 8),
      activityLimit: parseOptionalLimit(searchParams.get("activityLimit"), 8),
      billingLimit: parseOptionalLimit(searchParams.get("billingLimit"), 8),
      projectLimit: parseOptionalLimit(searchParams.get("projectLimit"), 8),
      recommendationLimit: parseOptionalLimit(
        searchParams.get("recommendationLimit"),
        6,
      ),
      taskLimit: parseOptionalLimit(searchParams.get("taskLimit"), 8),
    });

    return Response.json(overview);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
