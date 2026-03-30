import { NextRequest } from "next/server";
import { generateStream } from "@/lib/claudeClient";
import {
  getDispatchById,
  getCustomerByNo,
  getSiteByNo,
  getTimeBillsByDispatch,
  formatDispatchForPrompt,
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
  FALLBACK_SITES,
} from "@/lib/q360Client";
import {
  getDispatchByIdFromMockDb,
  getCustomerFromMockDb,
  getSiteFromMockDb,
  getTimeBillsFromMockDb,
} from "@/lib/mockDb";
import {
  projectStatusSystemPrompt,
  projectStatusUserPrompt,
  serviceClosureSystemPrompt,
  serviceClosureUserPrompt,
  overdueAlertSystemPrompt,
  overdueAlertUserPrompt,
  newCallAckSystemPrompt,
  newCallAckUserPrompt,
} from "@/lib/emailPrompts";
import type { GenerateRequest } from "@/types/feature2";
import type { Dispatch, Customer, Site, TimeBill } from "@/types/q360";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { recordId, automationType, tone } = body;

  if (!recordId || !tone) {
    return new Response("recordId and tone are required", { status: 400 });
  }

  const SUPPORTED_TYPES = ["project-status", "service-closure", "overdue-alert", "new-call-ack"];
  if (!SUPPORTED_TYPES.includes(automationType)) {
    return new Response(
      `Unsupported automation type: ${automationType}. Supported: ${SUPPORTED_TYPES.join(", ")}`,
      { status: 400 }
    );
  }

  try {
    let dispatch: Dispatch | null = null;
    let customer: Customer | null = null;
    let site: Site | null = null;
    let timeBills: TimeBill[] = [];

    if (USE_MOCK) {
      // Try SQLite mock.db first
      dispatch = getDispatchByIdFromMockDb(recordId);
      if (dispatch) {
        customer = getCustomerFromMockDb(dispatch.customerno);
        site = getSiteFromMockDb(dispatch.siteno);
        timeBills = getTimeBillsFromMockDb(recordId) ?? [];
      }

      // Fall back to hardcoded demo data
      if (!dispatch) {
        dispatch =
          FALLBACK_DISPATCHES.find((d) => d.dispatchno === recordId) ?? null;
        if (dispatch) {
          customer = FALLBACK_CUSTOMERS[dispatch.customerno] ?? null;
          site = FALLBACK_SITES[dispatch.siteno] ?? null;
        }
      }
    } else {
      try {
        dispatch = await getDispatchById(recordId);
        if (dispatch) {
          const [c, s, tb] = await Promise.all([
            getCustomerByNo(dispatch.customerno),
            getSiteByNo(dispatch.siteno),
            getTimeBillsByDispatch(recordId),
          ]);
          customer = c;
          site = s;
          timeBills = tb;
        }
      } catch (apiError) {
        console.error("Q360 API failed, trying fallback:", apiError);
        dispatch =
          FALLBACK_DISPATCHES.find((d) => d.dispatchno === recordId) ?? null;
        if (dispatch) {
          customer = FALLBACK_CUSTOMERS[dispatch.customerno] ?? null;
          site = FALLBACK_SITES[dispatch.siteno] ?? null;
        }
      }
    }

    if (!dispatch) {
      return new Response(`Dispatch ${recordId} not found`, { status: 404 });
    }

    const formattedData = formatDispatchForPrompt(
      dispatch,
      customer,
      site,
      timeBills
    );

    let systemPrompt: string;
    let userPrompt: string;

    switch (automationType) {
      case "project-status":
        systemPrompt = projectStatusSystemPrompt();
        userPrompt = projectStatusUserPrompt(formattedData, tone);
        break;
      case "service-closure":
        systemPrompt = serviceClosureSystemPrompt();
        userPrompt = serviceClosureUserPrompt(formattedData, tone);
        break;
      case "overdue-alert":
        systemPrompt = overdueAlertSystemPrompt();
        userPrompt = overdueAlertUserPrompt(formattedData, tone);
        break;
      case "new-call-ack":
        systemPrompt = newCallAckSystemPrompt();
        userPrompt = newCallAckUserPrompt(formattedData, tone);
        break;
    }

    const stream = await generateStream(systemPrompt, userPrompt);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate endpoint error:", error);
    return new Response("Failed to generate email. Please try again.", {
      status: 500,
    });
  }
}
