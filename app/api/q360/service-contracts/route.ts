import { NextRequest, NextResponse } from "next/server";
import { getServiceContracts } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const status = params.get("status");
    if (status) filters.push({ field: "STATUSCODE", op: "=", value: status });

    const customer = params.get("customer");
    if (customer) filters.push({ field: "CUSTOMERNO", op: "=", value: customer });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getServiceContracts(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
