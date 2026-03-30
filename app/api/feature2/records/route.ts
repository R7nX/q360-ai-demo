import { NextResponse } from "next/server";
import {
  getDispatchList,
  getCustomerByNo,
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
} from "@/lib/q360Client";
import {
  getDispatchesFromMockDb,
  getCustomerFromMockDb,
} from "@/lib/mockDb";
import type { RecordSummary } from "@/types/feature2";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  try {
    let records: RecordSummary[];

    if (USE_MOCK) {
      // Try SQLite mock.db first (from Ryan's seed script)
      const dbDispatches = getDispatchesFromMockDb();

      if (dbDispatches && dbDispatches.length > 0) {
        records = dbDispatches.map((d) => {
          const customer = getCustomerFromMockDb(d.customerno);
          return {
            id: d.dispatchno,
            customerName: customer?.company ?? d.customerno,
            siteName: d.description ?? "Unknown Site",
            status: d.statuscode,
            problem: d.problem ?? "No description",
            date: d.date ?? "",
            techAssigned: d.techassigned ?? "Unassigned",
          };
        });
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
    } else {
      const dispatches = await getDispatchList();
      records = await Promise.all(
        dispatches.map(async (d) => {
          const customer = await getCustomerByNo(d.customerno);
          return {
            id: d.dispatchno,
            customerName: customer?.company ?? d.customerno,
            siteName: d.description ?? "Unknown Site",
            status: d.statuscode,
            problem: d.problem ?? "No description",
            date: d.date ?? "",
            techAssigned: d.techassigned ?? "Unassigned",
          };
        })
      );
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
