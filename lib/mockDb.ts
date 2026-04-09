/**
 * Read-only SQLite accessors for local `mock.db` (dispatches, customers, sites, time bills, tasks).
 */
import Database from "better-sqlite3";
import type { Dispatch, Customer, Site, TimeBill } from "@/types/q360";
import { openReadonlySqliteDb } from "@/lib/sqlite";

function getDb(): Database.Database | null {
  return openReadonlySqliteDb();
}

function hasTable(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { name: string } | undefined;
  return !!row;
}

function getTableColumns(
  db: Database.Database,
  table: string
): Set<string> {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name?: string }>;
  return new Set(
    columns
      .map((column) => (column.name ?? "").toLowerCase())
      .filter((name) => name.length > 0)
  );
}

export function hasMockDbTable(table: string): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    return hasTable(db, table);
  } finally {
    db.close();
  }
}

export function getPreferredTechnicianFromMockDb(): string | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "dispatch")) return null;
    const dispatchColumns = getTableColumns(db, "dispatch");
    const hasTechAssignedColumn = dispatchColumns.has("techassigned");
    if (!hasTechAssignedColumn) return null;

    const row = db
      .prepare(
        `
          SELECT techassigned AS technician
          FROM dispatch
          WHERE techassigned IS NOT NULL AND techassigned != ''
          GROUP BY techassigned
          ORDER BY COUNT(*) DESC, techassigned ASC
          LIMIT 1
        `
      )
      .get() as { technician?: string } | undefined;

    return row?.technician ?? null;
  } finally {
    db.close();
  }
}

export function getDispatchesFromMockDb(): Dispatch[] | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "dispatch")) return null;
    const dispatchColumns = getTableColumns(db, "dispatch");
    const sortColumn = ["date", "opendate", "calldate"].find((column) =>
      dispatchColumns.has(column)
    );
    const query = sortColumn
      ? `SELECT * FROM dispatch ORDER BY ${sortColumn} DESC LIMIT 50`
      : "SELECT * FROM dispatch LIMIT 50";
    const rows = db.prepare(query).all() as Record<string, unknown>[];
    return rows.map(normalizeDispatch);
  } finally {
    db.close();
  }
}

export function getDispatchByIdFromMockDb(
  dispatchno: string
): Dispatch | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "dispatch")) return null;

    // Try exact match first, then partial match on primary key columns
    let row = db
      .prepare("SELECT * FROM dispatch WHERE dispatchno = ?")
      .get(dispatchno) as Record<string, unknown> | undefined;

    if (!row) {
      // The seed script may generate keys differently — try LIKE match
      row = db
        .prepare("SELECT * FROM dispatch WHERE dispatchno LIKE ?")
        .get(`%${dispatchno}%`) as Record<string, unknown> | undefined;
    }

    return row ? normalizeDispatch(row) : null;
  } finally {
    db.close();
  }
}

export function getCustomerFromMockDb(customerno: string): Customer | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "customer")) return null;
    const row = db
      .prepare("SELECT * FROM customer WHERE customerno = ?")
      .get(customerno) as Record<string, unknown> | undefined;

    if (!row) return null;
    const r = lowerKeys(row);
    return {
      customerno: str(r.customerno) ?? customerno,
      company: str(r.company) ?? "Unknown",
      type: str(r.type),
      status: str(r.status) ?? str(r.statuscode),
    };
  } finally {
    db.close();
  }
}

export function getSiteFromMockDb(siteno: string): Site | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "site")) return null;
    const row = db
      .prepare("SELECT * FROM site WHERE siteno = ?")
      .get(siteno) as Record<string, unknown> | undefined;

    if (!row) return null;
    const r = lowerKeys(row);
    return {
      siteno: str(r.siteno) ?? siteno,
      sitename: str(r.sitename) ?? "Unknown Site",
      address: str(r.address) ?? str(r.firstline),
      city: str(r.city),
      state: str(r.state),
      zip: str(r.zip),
      phone: str(r.phone),
    };
  } finally {
    db.close();
  }
}

export function getAllCustomersFromMockDb(): Record<string, Customer> {
  const db = getDb();
  if (!db) return {};

  try {
    if (!hasTable(db, "customer")) return {};
    const rows = db.prepare("SELECT * FROM customer").all() as Record<string, unknown>[];
    const map: Record<string, Customer> = {};
    for (const row of rows) {
      const r = lowerKeys(row);
      const no = str(r.customerno);
      if (!no) continue;
      map[no] = { customerno: no, company: str(r.company) ?? "Unknown", type: str(r.type), status: str(r.status) ?? str(r.statuscode) };
    }
    return map;
  } finally {
    db.close();
  }
}

export function getAllSitesFromMockDb(): Record<string, Site> {
  const db = getDb();
  if (!db) return {};

  try {
    if (!hasTable(db, "site")) return {};
    const rows = db.prepare("SELECT * FROM site").all() as Record<string, unknown>[];
    const map: Record<string, Site> = {};
    for (const row of rows) {
      const r = lowerKeys(row);
      const no = str(r.siteno);
      if (!no) continue;
      map[no] = { siteno: no, sitename: str(r.sitename) ?? "Unknown Site", address: str(r.address) ?? str(r.firstline), city: str(r.city), state: str(r.state), zip: str(r.zip), phone: str(r.phone) };
    }
    return map;
  } finally {
    db.close();
  }
}

export function getTimeBillsFromMockDb(dispatchno: string): TimeBill[] | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "timebill")) return null;
    const rows = db
      .prepare("SELECT * FROM timebill WHERE dispatchno = ?")
      .all(dispatchno) as Record<string, unknown>[];
    return rows.map((row) => {
      const r = lowerKeys(row);
      return {
        tbstarttime: str(r.date),
        tbendtime: str(r.timebilled),
        traveltime: null,
        techassigned: str(r.userid),
      };
    });
  } finally {
    db.close();
  }
}

export function getTasksFromMockDb(userid?: string): Record<string, unknown>[] | null {
  const db = getDb();
  if (!db) return null;

  try {
    const tableName =
      ["TASKS", "tasks", "task"].find((table) => hasTable(db, table)) ?? null;

    if (!tableName) return null;

    const rows = userid
      ? db
          .prepare(`SELECT * FROM ${tableName} WHERE USERID = ? ORDER BY ENDDATE ASC, PRIORITY ASC, TASKID ASC`)
          .all(userid)
      : db
          .prepare(`SELECT * FROM ${tableName} ORDER BY ENDDATE ASC, PRIORITY ASC, TASKID ASC`)
          .all();

    return rows as Record<string, unknown>[];
  } finally {
    db.close();
  }
}

// Helpers

function str(val: unknown): string | null {
  if (val == null) return null;
  return String(val);
}

function lowerKeys(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
}

function normalizeDispatch(row: Record<string, unknown>): Dispatch {
  const r = lowerKeys(row);
  return {
    dispatchno: str(r.dispatchno) ?? "",
    callno: str(r.callno) ?? "",
    customerno: str(r.customerno) ?? "",
    siteno: str(r.siteno) ?? "",
    statuscode: str(r.statuscode) ?? str(r.status) ?? "UNKNOWN",
    problem: str(r.problem) ?? str(r.problemtype),
    solution: str(r.solution),
    priority: str(r.priority),
    techassigned: str(r.techassigned),
    date: str(r.date) ?? str(r.opendate) ?? str(r.calldate),
    closedate: str(r.closedate),
    estfixtime: str(r.estfixtime),
    callername: str(r.callername) ?? str(r.caller),
    calleremail: str(r.calleremail),
    callerphone: str(r.callerphone) ?? str(r.callercontactno),
    description: str(r.description) ?? str(r.detail),
  };
}
