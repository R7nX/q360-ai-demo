/**
 * GET /api/q360/customers — Q360 customers with optional query filters.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const status = params.get("status");
    if (status) filters.push({ field: "STATUS", op: "=", value: status });

    const salesrep = params.get("salesrep");
    if (salesrep) filters.push({ field: "SALESREP", op: "=", value: salesrep });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getCustomers(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
