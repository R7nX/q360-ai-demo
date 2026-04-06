import { describe, it, expect } from "vitest";
import { computeDaysOverdue } from "@/app/api/feature2/overdue/route";
import type { Dispatch } from "@/types/q360";

// Base dispatch with no date fields set
const BASE: Dispatch = {
  dispatchno: "D-001",
  callno: "",
  customerno: "C-001",
  siteno: "S-001",
  statuscode: "OPEN",
  problem: "Test problem",
  solution: null,
  priority: null,
  techassigned: null,
  date: null,
  closedate: null,
  estfixtime: null,
  callername: null,
  calleremail: null,
  callerphone: null,
  description: null,
};

const TODAY = new Date("2025-04-10");

describe("computeDaysOverdue", () => {
  // ── No date info ────────────────────────────────────────────────────────────

  it("returns 0 when both estfixtime and date are null", () => {
    expect(computeDaysOverdue(BASE, TODAY)).toBe(0);
  });

  // ── estfixtime path ─────────────────────────────────────────────────────────

  it("uses estfixtime as the deadline when present", () => {
    // Deadline 2025-03-31 → 10 days before 2025-04-10
    const d = { ...BASE, estfixtime: "2025-03-31" };
    expect(computeDaysOverdue(d, TODAY)).toBe(10);
  });

  it("returns 0 when deadline is exactly today", () => {
    const d = { ...BASE, estfixtime: "2025-04-10" };
    expect(computeDaysOverdue(d, TODAY)).toBe(0);
  });

  it("returns a negative number when deadline is in the future", () => {
    const d = { ...BASE, estfixtime: "2025-04-15" };
    expect(computeDaysOverdue(d, TODAY)).toBe(-5);
  });

  // ── date+7 fallback path ─────────────────────────────────────────────────────

  it("falls back to date+7 when estfixtime is null", () => {
    // Opened 2025-03-24 → deadline 2025-03-31 → 10 days overdue
    const d = { ...BASE, date: "2025-03-24" };
    expect(computeDaysOverdue(d, TODAY)).toBe(10);
  });

  it("falls back to date+7 when estfixtime is the sentinel '.00'", () => {
    const d = { ...BASE, estfixtime: ".00", date: "2025-03-24" };
    expect(computeDaysOverdue(d, TODAY)).toBe(10);
  });

  it("falls back to date+7 when estfixtime is an empty string", () => {
    const d = { ...BASE, estfixtime: "   ", date: "2025-03-24" };
    expect(computeDaysOverdue(d, TODAY)).toBe(10);
  });

  // ── Invalid date strings ─────────────────────────────────────────────────────

  it("returns 0 when estfixtime is unparseable and date is also unparseable", () => {
    const d = { ...BASE, estfixtime: "not-a-date", date: "also-not-a-date" };
    expect(computeDaysOverdue(d, TODAY)).toBe(0);
  });

  it("returns 0 when estfixtime is unparseable and date is null", () => {
    const d = { ...BASE, estfixtime: "garbage" };
    expect(computeDaysOverdue(d, TODAY)).toBe(0);
  });

  // ── Precedence ───────────────────────────────────────────────────────────────

  it("prefers estfixtime over date+7 fallback", () => {
    // estfixtime: 5 days overdue; date+7 would give 10 days overdue
    const d = { ...BASE, estfixtime: "2025-04-05", date: "2025-03-24" };
    expect(computeDaysOverdue(d, TODAY)).toBe(5);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────────

  it("floors partial days (does not round up)", () => {
    // estfixtime at noon on 2025-04-09 — less than 1 full day before TODAY midnight
    const d = { ...BASE, estfixtime: "2025-04-09T12:00:00Z" };
    // TODAY is midnight 2025-04-10 UTC; difference ~0.5 day → floors to 0
    const result = computeDaysOverdue(d, new Date("2025-04-10T00:00:00Z"));
    expect(result).toBe(0);
  });

  it("calculates correctly for long-overdue dispatches", () => {
    // Opened a year ago
    const d = { ...BASE, estfixtime: "2024-04-10" };
    expect(computeDaysOverdue(d, TODAY)).toBe(365);
  });
});
