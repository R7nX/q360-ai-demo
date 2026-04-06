import { NextRequest, NextResponse } from "next/server";
import { getTimeBills } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const user = params.get("user");
    if (user) filters.push({ field: "USERID", op: "=", value: user });

    const dispatch = params.get("dispatch");
    if (dispatch) filters.push({ field: "DISPATCHNO", op: "=", value: dispatch });

    const project = params.get("project");
    if (project) filters.push({ field: "PROJECTNO", op: "=", value: project });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getTimeBills(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
