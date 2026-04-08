/**
 * Tests for seed-validate.ts — Phase 4 validation module.
 *
 * Tests the validation logic against in-memory seed data:
 * FK integrity, lifecycle rules, required fields, and summary output.
 */
import { describe, expect, it } from "vitest";

// These imports will fail until seed-validate.ts is implemented.
import {
  validateSeedData,
  type ValidationResult,
  type ValidationError,
  type SeedTables,
} from "../../scripts/seed-validate";

// ── Test Helpers ──────────────────────────────────────────────────────────────

function validCustomer(overrides: Partial<SeedTables["customers"][0]> = {}) {
  return { customerno: "CUST001", company: "Test Co", type: "Commercial", status: "Active", ...overrides };
}

function validSite(overrides: Partial<SeedTables["sites"][0]> = {}) {
  return { siteno: "SITE001", customerno: "CUST001", sitename: "Main Office", address: "1 Main St", city: "SLC", state: "UT", zip: "84101", phone: "555-0100", ...overrides };
}

function validDispatch(overrides: Partial<SeedTables["dispatches"][0]> = {}) {
  return {
    dispatchno: "D-0001", callno: "C-10001", customerno: "CUST001", siteno: "SITE001",
    statuscode: "OPEN", problem: "Test problem", solution: null, priority: 1,
    techassigned: null, date: "2026-03-01", closedate: null, estfixtime: "2026-03-20",
    callername: "John", calleremail: "j@test.com", callerphone: "555-0001", description: "Test",
    ...overrides,
  };
}

function validTimebill(overrides: Partial<SeedTables["timebills"][0]> = {}) {
  return { timebillno: "TB-0001", userid: "Maria Chen", dispatchno: "D-0001", customerno: "CUST001", date: "2026-03-01", timebilled: 2.5, rate: 95, category: "HVAC", ...overrides };
}

function validTask(overrides: Partial<SeedTables["tasks"][0]> = {}) {
  return { taskid: "TASK-001", userid: "Maria Chen", title: "Test task", priority: 1, enddate: "2026-04-01", completeddate: null, statuscode: "OPEN", ...overrides };
}

function makeTables(overrides: Partial<SeedTables> = {}): SeedTables {
  return {
    customers: [validCustomer()],
    sites: [validSite()],
    dispatches: [validDispatch()],
    timebills: [validTimebill()],
    tasks: [validTask()],
    ...overrides,
  };
}

function findErrors(result: ValidationResult, table: string, rule?: string): ValidationError[] {
  return result.errors.filter(
    (e) => e.table === table && (rule == null || e.rule === rule)
  );
}

// ── FK Integrity ──────────────────────────────────────────────────────────────

describe("seed-validate: FK integrity", () => {
  it("passes when all FKs are valid", () => {
    const result = validateSeedData(makeTables());
    expect(result.errors).toHaveLength(0);
    expect(result.totalRows).toBe(5);
  });

  it("reports site referencing nonexistent customer", () => {
    const tables = makeTables({
      sites: [validSite({ customerno: "CUST999" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "SITE", "fk_customerno");
    expect(errors).toHaveLength(1);
    expect(errors[0].id).toBe("SITE001");
    expect(errors[0].message).toContain("CUST999");
  });

  it("reports dispatch referencing nonexistent customer", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ customerno: "CUST999" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "fk_customerno");
    expect(errors).toHaveLength(1);
    expect(errors[0].id).toBe("D-0001");
  });

  it("reports dispatch referencing nonexistent site", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ siteno: "SITE999" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "fk_siteno");
    expect(errors).toHaveLength(1);
  });

  it("reports timebill referencing nonexistent dispatch", () => {
    const tables = makeTables({
      timebills: [validTimebill({ dispatchno: "D-9999" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "TIMEBILL", "fk_dispatchno");
    expect(errors).toHaveLength(1);
  });

  it("reports timebill referencing nonexistent customer", () => {
    const tables = makeTables({
      timebills: [validTimebill({ customerno: "CUST999" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "TIMEBILL", "fk_customerno");
    expect(errors).toHaveLength(1);
  });

  it("reports task with unknown userid", () => {
    const tables = makeTables({
      tasks: [validTask({ userid: "Unknown Person" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "TASKS", "fk_userid");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Unknown Person");
  });
});

// ── Lifecycle Rules ───────────────────────────────────────────────────────────

describe("seed-validate: lifecycle rules", () => {
  it("reports CLOSED dispatch without closedate", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "CLOSED", closedate: null })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "lifecycle_closed_needs_closedate");
    expect(errors).toHaveLength(1);
  });

  it("passes CLOSED dispatch with closedate", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "CLOSED", closedate: "2026-03-15", solution: "Fixed" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "lifecycle_closed_needs_closedate");
    expect(errors).toHaveLength(0);
  });

  it("reports OPEN dispatch with closedate", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "OPEN", closedate: "2026-03-15" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "lifecycle_open_no_closedate");
    expect(errors).toHaveLength(1);
  });

  it("reports IN PROGRESS dispatch with closedate", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "IN PROGRESS", closedate: "2026-03-15" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "lifecycle_open_no_closedate");
    expect(errors).toHaveLength(1);
  });

  it("reports timebill with zero or negative hours", () => {
    const tables = makeTables({
      timebills: [validTimebill({ timebilled: 0 })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "TIMEBILL", "lifecycle_positive_hours");
    expect(errors).toHaveLength(1);
  });

  it("passes timebill with positive hours", () => {
    const tables = makeTables({
      timebills: [validTimebill({ timebilled: 0.5 })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "TIMEBILL", "lifecycle_positive_hours");
    expect(errors).toHaveLength(0);
  });
});

// ── Required Fields ───────────────────────────────────────────────────────────

describe("seed-validate: required fields", () => {
  it("reports duplicate customer primary keys", () => {
    const tables = makeTables({
      customers: [validCustomer(), validCustomer()],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "CUSTOMER", "unique_pk");
    expect(errors).toHaveLength(1);
  });

  it("reports duplicate dispatch primary keys", () => {
    const tables = makeTables({
      dispatches: [validDispatch(), validDispatch()],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "unique_pk");
    expect(errors).toHaveLength(1);
  });

  it("reports null primary key on site", () => {
    const tables = makeTables({
      sites: [validSite({ siteno: null as unknown as string })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "SITE", "non_null_pk");
    expect(errors).toHaveLength(1);
  });

  it("reports unknown statuscode on dispatch", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "BOGUS" })],
    });
    const result = validateSeedData(tables);
    const errors = findErrors(result, "DISPATCH", "valid_statuscode");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("BOGUS");
  });
});

// ── Summary Output ────────────────────────────────────────────────────────────

describe("seed-validate: summary", () => {
  it("returns correct row counts per table", () => {
    const tables = makeTables({
      customers: [validCustomer({ customerno: "C1" }), validCustomer({ customerno: "C2" })],
      sites: [validSite({ siteno: "S1", customerno: "C1" })],
      dispatches: [],
      timebills: [],
      tasks: [],
    });
    const result = validateSeedData(tables);
    expect(result.tables.CUSTOMER).toBe(2);
    expect(result.tables.SITE).toBe(1);
    expect(result.tables.DISPATCH).toBe(0);
    expect(result.totalRows).toBe(3);
  });

  it("returns formatReport() as a human-readable string", () => {
    const result = validateSeedData(makeTables());
    expect(result.formatReport()).toContain("Validation Report");
    expect(result.formatReport()).toContain("CUSTOMER");
    expect(result.formatReport()).toContain("all checks passed");
  });

  it("formatReport includes error details when validation fails", () => {
    const tables = makeTables({
      dispatches: [validDispatch({ statuscode: "CLOSED", closedate: null })],
    });
    const result = validateSeedData(tables);
    expect(result.formatReport()).toContain("DISPATCH");
    expect(result.formatReport()).toContain("D-0001");
    expect(result.formatReport()).toMatch(/\d+ error/);
  });
});

// ── Integration with real story data ──────────────────────────────────────────

describe("seed-validate: story data integration", () => {
  it("validates actual seed-data.ts with zero errors", async () => {
    const { CUSTOMERS, SITES, DISPATCHES, TIMEBILLS, TASKS, TECHNICIANS, daysAgo } = await import("../../scripts/seed-data");

    const now = new Date();
    const tables: SeedTables = {
      customers: CUSTOMERS.map((c) => ({ ...c })),
      sites: SITES.map((s) => ({ ...s })),
      dispatches: DISPATCHES.map((d) => ({
        dispatchno: d.dispatchno,
        callno: d.callno,
        customerno: d.customerno,
        siteno: d.siteno,
        statuscode: d.statuscode,
        problem: d.problem,
        solution: d.solution,
        priority: d.priority,
        techassigned: d.techassigned,
        date: daysAgo(d.openDaysAgo, now),
        closedate: d.closeDaysAgo != null ? daysAgo(d.closeDaysAgo, now) : null,
        estfixtime: daysAgo(d.estFixDaysAgo, now),
        callername: d.callername,
        calleremail: d.calleremail,
        callerphone: d.callerphone,
        description: d.description,
      })),
      timebills: TIMEBILLS.map((tb) => ({
        timebillno: tb.timebillno,
        userid: tb.userid,
        dispatchno: tb.dispatchno,
        customerno: tb.customerno,
        date: daysAgo(tb.daysAgo, now),
        timebilled: tb.timebilled,
        rate: tb.rate,
        category: tb.category,
      })),
      tasks: TASKS.map((t) => ({
        taskid: t.taskid,
        userid: t.userid,
        title: t.title,
        priority: t.priority,
        enddate: daysAgo(-t.endDaysFromNow, now),
        completeddate: t.completedDaysAgo != null ? daysAgo(t.completedDaysAgo, now) : null,
        statuscode: t.completedDaysAgo != null ? "CLOSED" : "OPEN",
      })),
      knownUsers: TECHNICIANS.map((t) => t.name),
    };

    const result = validateSeedData(tables);
    if (result.errors.length > 0) {
      console.log(result.formatReport());
    }
    expect(result.errors).toHaveLength(0);
    expect(result.totalRows).toBe(
      CUSTOMERS.length + SITES.length + DISPATCHES.length + TIMEBILLS.length + TASKS.length
    );
  });
});
