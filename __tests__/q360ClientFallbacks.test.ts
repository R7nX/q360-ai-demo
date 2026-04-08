/**
 * Guards fallback dispatch data that powers unseeded/local demo environments.
 */
import { describe, it, expect } from "vitest";
import { FALLBACK_DISPATCHES } from "@/lib/q360Client";

describe("FALLBACK_DISPATCHES", () => {
  it("includes at least one OPEN or PENDING dispatch for new-call-ack", () => {
    const hasNewCallEligibleDispatch = FALLBACK_DISPATCHES.some((dispatch) =>
      dispatch.statuscode === "OPEN" || dispatch.statuscode === "PENDING" || dispatch.statuscode === "IN PROGRESS"
    );

    expect(hasNewCallEligibleDispatch).toBe(true);
  });

  it("includes D-0009 so shared harness default resolves in fallback mode", () => {
    expect(
      FALLBACK_DISPATCHES.some((dispatch) => dispatch.dispatchno === "D-0009")
    ).toBe(true);
  });
});
