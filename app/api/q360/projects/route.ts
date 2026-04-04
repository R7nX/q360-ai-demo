import { NextRequest, NextResponse } from "next/server";
import { getProjects } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const status = params.get("status");
    if (status) filters.push({ field: "STATUSCODE", op: "=", value: status });

    const leader = params.get("leader");
    if (leader) filters.push({ field: "PROJECTLEADER", op: "=", value: leader });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getProjects(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
