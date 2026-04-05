/**
 * POST /api/feature2/overdue — batches open dispatches, scores overdue risk, and returns AI analysis
 * for the overdue-alert automation (mock DB or fallbacks).
 */
import { generateJSON } from "@/lib/agentClient";
import {
  getDispatchesFromMockDb,
  getAllCustomersFromMockDb,
  getAllSitesFromMockDb,
} from "@/lib/mockDb";
import {
  overdueBatchSystemPrompt,
  overdueBatchUserPrompt,
  type OverdueDispatchInput,
} from "@/lib/emailPrompts";
import {
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
  FALLBACK_SITES,
} from "@/lib/q360Client";
import { computeDaysOverdue } from "@/lib/computeDaysOverdue";
import type { Dispatch, Customer, Site } from "@/types/q360";
import type { OverdueApiResponse, OverdueAnalysisResult } from "@/types/feature2";

const OPEN_STATUSES = new Set(["OPEN", "IN PROGRESS", "PENDING", "ON HOLD"]);

export async function POST(): Promise<Response> {
  const today = new Date();

  try {
    let allDispatches: Dispatch[] = [];
    let customers: Record<string, Customer> = {};
    let sites: Record<string, Site> = {};

    allDispatches = (await getDispatchesFromMockDb()) ?? FALLBACK_DISPATCHES;
    customers = { ...FALLBACK_CUSTOMERS, ...(await getAllCustomersFromMockDb()) };
    sites = { ...FALLBACK_SITES, ...(await getAllSitesFromMockDb()) };

    const openDispatches = allDispatches.filter((d) =>
      OPEN_STATUSES.has(d.statuscode?.toUpperCase())
    );

    if (openDispatches.length === 0) {
      return Response.json({ success: true, data: null, state: "empty", message: "No open dispatches found." } satisfies OverdueApiResponse);
    }

    const overdueInputs: OverdueDispatchInput[] = [];

    for (const dispatch of openDispatches) {
      const daysOverdue = computeDaysOverdue(dispatch, today);
      if (daysOverdue <= 0) continue;

      const customer = customers[dispatch.customerno];
      const site = sites[dispatch.siteno];

      overdueInputs.push({
        dispatchno: dispatch.dispatchno,
        customer: customer?.company ?? dispatch.customerno ?? "Unknown",
        site: site
          ? [site.sitename, site.city, site.state].filter(Boolean).join(", ")
          : dispatch.siteno ?? "Unknown Site",
        problem: dispatch.problem ?? "[Not provided]",
        techAssigned: dispatch.techassigned ?? null,
        priority: dispatch.priority ?? null,
        daysOverdue,
        openedDate: dispatch.date ?? null,
      });
    }

    if (overdueInputs.length === 0) {
      return Response.json({
        success: true, data: null, state: "all_clear",
        message: `All ${openDispatches.length} open dispatch${openDispatches.length !== 1 ? "es are" : " is"} within SLA.`,
      } satisfies OverdueApiResponse);
    }

    const capped = overdueInputs.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 15);

    const rawText = await generateJSON(overdueBatchSystemPrompt(), overdueBatchUserPrompt(capped, openDispatches.length), 8192);

    // Strip markdown fences, then find the outermost JSON object
    const stripped = rawText.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    const jsonStart = stripped.indexOf("{");
    const jsonEnd = stripped.lastIndexOf("}");
    const cleaned = jsonStart !== -1 && jsonEnd !== -1 ? stripped.slice(jsonStart, jsonEnd + 1) : stripped;

    let parsed: OverdueAnalysisResult;
    try {
      parsed = JSON.parse(cleaned) as OverdueAnalysisResult;
    } catch {
      console.error("Failed to parse AI JSON. Raw response:\n", rawText.slice(0, 500));
      return Response.json({ success: false, data: null, state: "error", message: "AI returned invalid JSON." } satisfies OverdueApiResponse, { status: 502 });
    }

    return Response.json({ success: true, data: parsed, state: "alerts" } satisfies OverdueApiResponse);
  } catch (error) {
    console.error("Overdue route error:", error);
    return Response.json({ success: false, data: null, state: "error", message: "Failed to scan dispatches. Please try again." } satisfies OverdueApiResponse, { status: 500 });
  }
}
