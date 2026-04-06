import { NextRequest, NextResponse } from "next/server";
import { getInvoices } from "@/lib/q360";
import type { Q360Filter } from "@/lib/q360";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: Q360Filter[] = [];

    const customer = params.get("customer");
    if (customer) filters.push({ field: "CUSTOMERNO", op: "=", value: customer });

    const type = params.get("type");
    if (type) filters.push({ field: "INVOICETYPE", op: "=", value: type });

    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const data = await getInvoices(filters.length ? filters : undefined, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
