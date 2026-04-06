import { describe, it, expect } from "vitest";
import {
  overdueBatchSystemPrompt,
  overdueBatchUserPrompt,
  projectStatusSystemPrompt,
  projectStatusUserPrompt,
  serviceClosureSystemPrompt,
  serviceClosureUserPrompt,
  newCallAckSystemPrompt,
  newCallAckUserPrompt,
  overdueAlertSystemPrompt,
  overdueAlertUserPrompt,
  type OverdueDispatchInput,
} from "@/lib/emailPrompts";

// ── Shared fixture ────────────────────────────────────────────────────────────

const DISPATCH: OverdueDispatchInput = {
  dispatchno: "D-001",
  customer: "Acme Corp",
  site: "Main Office, Salt Lake City, UT",
  problem: "HVAC not working",
  techAssigned: "John Doe",
  priority: "1",
  daysOverdue: 15,
  openedDate: "2025-03-01",
};

// ── overdueBatchSystemPrompt ──────────────────────────────────────────────────

describe("overdueBatchSystemPrompt", () => {
  it("returns a non-empty string", () => {
    expect(overdueBatchSystemPrompt()).toBeTypeOf("string");
    expect(overdueBatchSystemPrompt().length).toBeGreaterThan(50);
  });

  it("defines all three urgency tiers", () => {
    const prompt = overdueBatchSystemPrompt();
    expect(prompt).toContain("CRITICAL");
    expect(prompt).toContain("HIGH");
    expect(prompt).toContain("MEDIUM");
  });

  it("instructs to return only valid JSON", () => {
    expect(overdueBatchSystemPrompt()).toContain("Return ONLY valid JSON");
  });

  it("specifies the required JSON structure fields", () => {
    const prompt = overdueBatchSystemPrompt();
    expect(prompt).toContain("totalScanned");
    expect(prompt).toContain("totalOverdue");
    expect(prompt).toContain("aiSummary");
    expect(prompt).toContain("recommendedAction");
  });
});

// ── overdueBatchUserPrompt ────────────────────────────────────────────────────

describe("overdueBatchUserPrompt", () => {
  it("includes totalScanned count", () => {
    expect(overdueBatchUserPrompt([DISPATCH], 20)).toContain("20");
  });

  it("includes dispatch number", () => {
    expect(overdueBatchUserPrompt([DISPATCH], 1)).toContain("D-001");
  });

  it("includes customer name", () => {
    expect(overdueBatchUserPrompt([DISPATCH], 1)).toContain("Acme Corp");
  });

  it("includes days overdue", () => {
    expect(overdueBatchUserPrompt([DISPATCH], 1)).toContain("15");
  });

  it("includes site", () => {
    expect(overdueBatchUserPrompt([DISPATCH], 1)).toContain(
      "Main Office, Salt Lake City, UT"
    );
  });

  it("shows UNASSIGNED when techAssigned is null", () => {
    const prompt = overdueBatchUserPrompt(
      [{ ...DISPATCH, techAssigned: null }],
      1
    );
    expect(prompt).toContain("UNASSIGNED");
  });

  it("separates multiple dispatches with ---", () => {
    const prompt = overdueBatchUserPrompt(
      [DISPATCH, { ...DISPATCH, dispatchno: "D-002" }],
      2
    );
    expect(prompt).toContain("---");
  });

  it("handles empty dispatch list gracefully", () => {
    const prompt = overdueBatchUserPrompt([], 5);
    expect(prompt).toContain("5"); // totalScanned still shown
    expect(prompt).toContain("0"); // overdue count is 0
  });

  it("falls back to [Not provided] for null problem", () => {
    const prompt = overdueBatchUserPrompt(
      [{ ...DISPATCH, problem: null as unknown as string }],
      1
    );
    expect(prompt).toContain("[Not provided]");
  });
});

// ── Tone-aware prompts ────────────────────────────────────────────────────────

describe("projectStatusUserPrompt — tone instructions", () => {
  it("includes the entity data string verbatim", () => {
    expect(projectStatusUserPrompt("dispatch data xyz", "professional")).toContain(
      "dispatch data xyz"
    );
  });

  it("professional tone — references formal business language", () => {
    expect(projectStatusUserPrompt("data", "professional")).toContain(
      "formal business language"
    );
  });

  it("friendly tone — references warm/approachable language", () => {
    expect(projectStatusUserPrompt("data", "friendly")).toContain("warm");
  });

  it("concise tone — references short/direct output", () => {
    expect(projectStatusUserPrompt("data", "concise")).toContain("short");
  });

  it("instructs SUBJECT: format", () => {
    expect(projectStatusUserPrompt("data", "professional")).toContain("SUBJECT:");
  });
});

describe("serviceClosureUserPrompt", () => {
  it("includes entity data", () => {
    expect(serviceClosureUserPrompt("closure data", "concise")).toContain(
      "closure data"
    );
  });

  it("instructs SUBJECT: format", () => {
    expect(serviceClosureUserPrompt("data", "professional")).toContain(
      "SUBJECT:"
    );
  });

  it("references completion in the prompt", () => {
    expect(serviceClosureUserPrompt("data", "professional").toLowerCase()).toContain(
      "complet"
    );
  });
});

describe("newCallAckUserPrompt", () => {
  it("includes entity data", () => {
    expect(newCallAckUserPrompt("new call data", "friendly")).toContain(
      "new call data"
    );
  });

  it("instructs SUBJECT: format", () => {
    expect(newCallAckUserPrompt("data", "professional")).toContain("SUBJECT:");
  });

  it("references acknowledgement in the prompt", () => {
    expect(newCallAckUserPrompt("data", "professional").toLowerCase()).toContain(
      "acknowledg"
    );
  });
});

describe("overdueAlertUserPrompt", () => {
  it("includes entity data", () => {
    expect(overdueAlertUserPrompt("overdue data", "professional")).toContain(
      "overdue data"
    );
  });

  it("instructs SUBJECT: format", () => {
    expect(overdueAlertUserPrompt("data", "professional")).toContain("SUBJECT:");
  });
});

// ── System prompts — common rules ─────────────────────────────────────────────

const SYSTEM_PROMPTS = [
  ["projectStatus", projectStatusSystemPrompt],
  ["serviceClosure", serviceClosureSystemPrompt],
  ["newCallAck", newCallAckSystemPrompt],
  ["overdueAlert", overdueAlertSystemPrompt],
  ["overdueBatch", overdueBatchSystemPrompt],
] as const;

describe("system prompts — common rules", () => {
  it.each(SYSTEM_PROMPTS)("%s returns a non-empty string", (_name, fn) => {
    expect(fn()).toBeTypeOf("string");
    expect(fn().length).toBeGreaterThan(50);
  });

  it.each(SYSTEM_PROMPTS)(
    "%s instructs not to fabricate data",
    (_name, fn) => {
      expect(fn().toLowerCase()).toContain("fabricate");
    }
  );
});
