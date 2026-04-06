import { NextRequest, NextResponse } from "next/server";
import { getDispatches } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const status = params.get("status");
    if (status) filters.push({ field: "STATUSCODE", op: "=", value: status });

    const tech = params.get("tech");
    if (tech) filters.push({ field: "TECHASSIGNED", op: "=", value: tech });

    const priority = params.get("priority");
    if (priority) filters.push({ field: "PRIORITY", op: "=", value: priority });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getDispatches(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
