import { NextResponse } from "next/server";
import {
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
} from "@/lib/q360Client";
import {
  getDispatchesFromMockDb,
  getCustomerFromMockDb,
} from "@/lib/mockDb";
import type { RecordSummary } from "@/types/feature2";

export async function GET() {
  try {
    let records: RecordSummary[];

    const dbDispatches = await getDispatchesFromMockDb();

    if (dbDispatches && dbDispatches.length > 0) {
      records = await Promise.all(dbDispatches.map(async (d) => {
        const customer = await getCustomerFromMockDb(d.customerno);
        return {
          id: d.dispatchno,
          customerName: customer?.company ?? d.customerno,
          siteName: d.description ?? "Unknown Site",
          status: d.statuscode,
          problem: d.problem ?? "No description",
          date: d.date ?? "",
          techAssigned: d.techassigned ?? "Unassigned",
        };
      }));
    } else {
      // Fall back to hardcoded demo data
      records = FALLBACK_DISPATCHES.map((d) => ({
        id: d.dispatchno,
        customerName:
          FALLBACK_CUSTOMERS[d.customerno]?.company ?? d.customerno,
        siteName: d.description ?? "Unknown Site",
        status: d.statuscode,
        problem: d.problem ?? "No description",
        date: d.date ?? "",
        techAssigned: d.techassigned ?? "Unassigned",
      }));
    }

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to fetch records:", error);

    // Last resort fallback
    const records: RecordSummary[] = FALLBACK_DISPATCHES.map((d) => ({
      id: d.dispatchno,
      customerName:
        FALLBACK_CUSTOMERS[d.customerno]?.company ?? d.customerno,
      siteName: d.description ?? "Unknown Site",
      status: d.statuscode,
      problem: d.problem ?? "No description",
      date: d.date ?? "",
      techAssigned: d.techassigned ?? "Unassigned",
    }));

    return NextResponse.json({ records, fallback: true });
  }
}
