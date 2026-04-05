import { NextRequest, NextResponse } from "next/server";
import { getSites } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const customer = params.get("customer");
    if (customer) filters.push({ field: "CUSTOMERNO", op: "=", value: customer });

    const zone = params.get("zone");
    if (zone) filters.push({ field: "ZONE", op: "=", value: zone });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getSites(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
