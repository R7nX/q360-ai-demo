/**
 * seed-validate.ts
 *
 * Validates seeded data for FK integrity, lifecycle rules, and required fields.
 * Can be run standalone via `npm run seed:validate` or called after seeding.
 */

import { TECHNICIANS } from "./seed-data";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SeedTables {
  customers: Array<Record<string, unknown>>;
  sites: Array<Record<string, unknown>>;
  dispatches: Array<Record<string, unknown>>;
  timebills: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  /** Optional override for known user names (defaults to TECHNICIANS from seed-data). */
  knownUsers?: string[];
}

export interface ValidationError {
  table: string;
  id: string;
  rule: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  tables: Record<string, number>;
  totalRows: number;
  formatReport: () => string;
}

// ── Known Enums ───────────────────────────────────────────────────────────────

const VALID_DISPATCH_STATUSES = new Set([
  "OPEN", "CLOSED", "IN PROGRESS", "PENDING", "ON HOLD", "CANCELLED",
]);

const VALID_TASK_STATUSES = new Set(["OPEN", "CLOSED"]);

// ── Validation Logic ──────────────────────────────────────────────────────────

export function validateSeedData(tables: SeedTables): ValidationResult {
  const errors: ValidationError[] = [];
  const knownUsers = new Set(
    tables.knownUsers ?? TECHNICIANS.map((t) => t.name)
  );

  // Build lookup sets — empty set means the table was not seeded, so FK checks are skipped.
  const customerNos = new Set(tables.customers.map((c) => String(c.customerno)));
  const siteNos = new Set(tables.sites.map((s) => String(s.siteno)));
  const dispatchNos = new Set(tables.dispatches.map((d) => String(d.dispatchno)));

  const hasCustomers = customerNos.size > 0;
  const hasSites = siteNos.size > 0;
  const hasDispatches = dispatchNos.size > 0;

  // ── CUSTOMER checks ─────────────────────────────────────────────────────
  const seenCustomerPKs = new Set<string>();
  for (const c of tables.customers) {
    const pk = c.customerno;
    if (pk == null) {
      errors.push({ table: "CUSTOMER", id: "(null)", rule: "non_null_pk", message: "customerno is null" });
      continue;
    }
    const pkStr = String(pk);
    if (seenCustomerPKs.has(pkStr)) {
      errors.push({ table: "CUSTOMER", id: pkStr, rule: "unique_pk", message: `Duplicate customerno: ${pkStr}` });
    }
    seenCustomerPKs.add(pkStr);
  }

  // ── SITE checks ─────────────────────────────────────────────────────────
  const seenSitePKs = new Set<string>();
  for (const s of tables.sites) {
    const pk = s.siteno;
    if (pk == null) {
      errors.push({ table: "SITE", id: "(null)", rule: "non_null_pk", message: "siteno is null" });
      continue;
    }
    const pkStr = String(pk);
    if (seenSitePKs.has(pkStr)) {
      errors.push({ table: "SITE", id: pkStr, rule: "unique_pk", message: `Duplicate siteno: ${pkStr}` });
    }
    seenSitePKs.add(pkStr);

    if (hasCustomers) {
      const custNo = String(s.customerno);
      if (!customerNos.has(custNo)) {
        errors.push({ table: "SITE", id: pkStr, rule: "fk_customerno", message: `References nonexistent customer: ${custNo}` });
      }
    }
  }

  // ── DISPATCH checks ─────────────────────────────────────────────────────
  const seenDispatchPKs = new Set<string>();
  for (const d of tables.dispatches) {
    const pk = d.dispatchno;
    if (pk == null) {
      errors.push({ table: "DISPATCH", id: "(null)", rule: "non_null_pk", message: "dispatchno is null" });
      continue;
    }
    const pkStr = String(pk);
    if (seenDispatchPKs.has(pkStr)) {
      errors.push({ table: "DISPATCH", id: pkStr, rule: "unique_pk", message: `Duplicate dispatchno: ${pkStr}` });
    }
    seenDispatchPKs.add(pkStr);

    // FK checks (skipped when referenced table has no rows — partial seed scenario)
    if (hasCustomers) {
      const custNo = String(d.customerno);
      if (!customerNos.has(custNo)) {
        errors.push({ table: "DISPATCH", id: pkStr, rule: "fk_customerno", message: `References nonexistent customer: ${custNo}` });
      }
    }
    if (hasSites) {
      const siteNo = String(d.siteno);
      if (!siteNos.has(siteNo)) {
        errors.push({ table: "DISPATCH", id: pkStr, rule: "fk_siteno", message: `References nonexistent site: ${siteNo}` });
      }
    }

    // Statuscode enum
    const status = String(d.statuscode);
    if (!VALID_DISPATCH_STATUSES.has(status)) {
      errors.push({ table: "DISPATCH", id: pkStr, rule: "valid_statuscode", message: `Invalid statuscode: ${status}` });
    }

    // Lifecycle: CLOSED needs closedate
    if (status === "CLOSED" && d.closedate == null) {
      errors.push({ table: "DISPATCH", id: pkStr, rule: "lifecycle_closed_needs_closedate", message: "CLOSED dispatch has no closedate" });
    }

    // Lifecycle: OPEN/IN PROGRESS should not have closedate
    if ((status === "OPEN" || status === "IN PROGRESS") && d.closedate != null) {
      errors.push({ table: "DISPATCH", id: pkStr, rule: "lifecycle_open_no_closedate", message: `${status} dispatch has a closedate` });
    }
  }

  // ── TIMEBILL checks ─────────────────────────────────────────────────────
  const seenTimebillPKs = new Set<string>();
  for (const tb of tables.timebills) {
    const pk = tb.timebillno;
    if (pk == null) {
      errors.push({ table: "TIMEBILL", id: "(null)", rule: "non_null_pk", message: "timebillno is null" });
      continue;
    }
    const pkStr = String(pk);
    if (seenTimebillPKs.has(pkStr)) {
      errors.push({ table: "TIMEBILL", id: pkStr, rule: "unique_pk", message: `Duplicate timebillno: ${pkStr}` });
    }
    seenTimebillPKs.add(pkStr);

    // FK checks (skipped when referenced table has no rows — partial seed scenario)
    if (hasDispatches) {
      const dispNo = String(tb.dispatchno);
      if (!dispatchNos.has(dispNo)) {
        errors.push({ table: "TIMEBILL", id: pkStr, rule: "fk_dispatchno", message: `References nonexistent dispatch: ${dispNo}` });
      }
    }
    if (hasCustomers) {
      const custNo = String(tb.customerno);
      if (!customerNos.has(custNo)) {
        errors.push({ table: "TIMEBILL", id: pkStr, rule: "fk_customerno", message: `References nonexistent customer: ${custNo}` });
      }
    }

    // Lifecycle: positive hours
    const hours = Number(tb.timebilled);
    if (!(hours > 0)) {
      errors.push({ table: "TIMEBILL", id: pkStr, rule: "lifecycle_positive_hours", message: `timebilled must be > 0, got ${tb.timebilled}` });
    }
  }

  // ── TASKS checks ────────────────────────────────────────────────────────
  const seenTaskPKs = new Set<string>();
  for (const t of tables.tasks) {
    const pk = t.taskid;
    if (pk == null) {
      errors.push({ table: "TASKS", id: "(null)", rule: "non_null_pk", message: "taskid is null" });
      continue;
    }
    const pkStr = String(pk);
    if (seenTaskPKs.has(pkStr)) {
      errors.push({ table: "TASKS", id: pkStr, rule: "unique_pk", message: `Duplicate taskid: ${pkStr}` });
    }
    seenTaskPKs.add(pkStr);

    // FK: userid
    const userId = String(t.userid);
    if (!knownUsers.has(userId)) {
      errors.push({ table: "TASKS", id: pkStr, rule: "fk_userid", message: `Unknown userid: ${userId}` });
    }

    // Statuscode enum (if present)
    if (t.statuscode != null) {
      const status = String(t.statuscode);
      if (!VALID_TASK_STATUSES.has(status)) {
        errors.push({ table: "TASKS", id: pkStr, rule: "valid_statuscode", message: `Invalid statuscode: ${status}` });
      }
    }
  }

  // ── Build result ────────────────────────────────────────────────────────

  const tableCounts: Record<string, number> = {
    CUSTOMER: tables.customers.length,
    SITE: tables.sites.length,
    DISPATCH: tables.dispatches.length,
    TIMEBILL: tables.timebills.length,
    TASKS: tables.tasks.length,
  };

  const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  return {
    errors,
    tables: tableCounts,
    totalRows,
    formatReport() {
      const lines: string[] = [];
      lines.push("Validation Report");
      lines.push("─────────────────");

      for (const [table, count] of Object.entries(tableCounts)) {
        const tableErrors = errors.filter((e) => e.table === table);
        if (tableErrors.length === 0) {
          lines.push(`${table.padEnd(12)} ${String(count).padStart(3)} rows   ✓ all checks passed`);
        } else {
          lines.push(`${table.padEnd(12)} ${String(count).padStart(3)} rows   ✗ ${tableErrors.length} error${tableErrors.length > 1 ? "s" : ""}`);
          for (const err of tableErrors) {
            lines.push(`  → ${err.id}: ${err.message}`);
          }
        }
      }

      lines.push("");
      lines.push(`Total: ${totalRows} rows across ${Object.keys(tableCounts).length} tables, ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      return lines.join("\n");
    },
  };
}

// ── CLI Entry Point ───────────────────────────────────────────────────────────

async function main() {
  // Load .env.local
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // ignore
  }

  const useMock = process.env.USE_MOCK_DATA?.toLowerCase() === "true";
  const dbPath = process.env.MOCK_DB_PATH ?? "mock.db";

  if (!useMock) {
    console.error("  seed:validate currently only supports SQLite (USE_MOCK_DATA=true).");
    process.exit(1);
  }

  const Database = (await import("better-sqlite3")).default;
  const db = new Database(dbPath);

  try {
    const queryAll = (table: string) => {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
        // Normalize column names to lowercase so validators work regardless of how the
        // table was created (some tables use UPPERCASE column names, e.g. tasks).
        return rows.map((row) =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))
        );
      } catch {
        return [];
      }
    };

    const tables: SeedTables = {
      customers: queryAll("customer"),
      sites: queryAll("site"),
      dispatches: queryAll("dispatch"),
      timebills: queryAll("timebill"),
      tasks: queryAll("tasks"),
    };

    const result = validateSeedData(tables);
    console.log("\n" + result.formatReport() + "\n");
    process.exit(result.errors.length > 0 ? 1 : 0);
  } finally {
    db.close();
  }
}

// Only run main when executed directly (not when imported by tests).
if (process.argv[1]?.endsWith("seed-validate.ts") || process.argv[1]?.endsWith("seed-validate.js")) {
  main().catch((err) => {
    console.error("  Validation failed:", err);
    process.exit(1);
  });
}
