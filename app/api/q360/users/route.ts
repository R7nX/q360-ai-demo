import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const type = params.get("type");
    if (type) filters.push({ field: "TYPE", op: "=", value: type });

    const branch = params.get("branch");
    if (branch) filters.push({ field: "BRANCH", op: "=", value: branch });

    const active = params.get("active");
    if (active) filters.push({ field: "ACTIVEFLAG", op: "=", value: active });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getUsers(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
