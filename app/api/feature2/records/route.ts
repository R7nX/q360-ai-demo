import { NextResponse } from "next/server";
import {
  getDispatchList,
  getCustomerByNo,
} from "@/lib/q360Client";
import {
  getDispatchesFromMockDb,
  getCustomerFromMockDb,
} from "@/lib/mockDb";
import type { RecordSummary } from "@/types/feature2";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  try {
    if (USE_MOCK) {
      const dbDispatches = getDispatchesFromMockDb();
      if (!dbDispatches || dbDispatches.length === 0) {
        return NextResponse.json(
          {
            error:
              "Mock mode requires actual SQLite dispatch rows. Seed at least the dispatch table into mock.db.",
          },
          { status: 503 },
        );
      }

      const records: RecordSummary[] = dbDispatches.map((dispatch) => {
        const customer = getCustomerFromMockDb(dispatch.customerno);
        return {
          id: dispatch.dispatchno,
          customerName: customer?.company ?? dispatch.customerno,
          siteName: dispatch.description ?? "Unknown Site",
          status: dispatch.statuscode,
          problem: dispatch.problem ?? "No description",
          date: dispatch.date ?? "",
          techAssigned: dispatch.techassigned ?? "Unassigned",
        };
      });

      return NextResponse.json({ records });
    }

    const dispatches = await getDispatchList();
    const records = await Promise.all(
      dispatches.map(async (dispatch) => {
        const customer = await getCustomerByNo(dispatch.customerno);
        return {
          id: dispatch.dispatchno,
          customerName: customer?.company ?? dispatch.customerno,
          siteName: dispatch.description ?? "Unknown Site",
          status: dispatch.statuscode,
          problem: dispatch.problem ?? "No description",
          date: dispatch.date ?? "",
          techAssigned: dispatch.techassigned ?? "Unassigned",
        };
      }),
    );

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to fetch records:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch dispatch records.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 },
    );
  }
}
