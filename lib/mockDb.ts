import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Dispatch, Customer, Site, TimeBill } from "@/types/q360";

const DB_PATH = path.join(process.cwd(), "mock.db");

function getDb(): Database.Database | null {
  if (!fs.existsSync(DB_PATH)) return null;
  return new Database(DB_PATH, { readonly: true });
}

function hasTable(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { name: string } | undefined;
  return !!row;
}

export function getDispatchesFromMockDb(): Dispatch[] | null {
  const db = getDb();
  if (!db) return null;

  try {
    if (!hasTable(db, "dispatch")) return null;
    const rows = db
      .prepare("SELECT * FROM dispatch ORDER BY date DESC LIMIT 50")
      .all() as Record<string, unknown>[];
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
    return {
      customerno: str(row.customerno) ?? customerno,
      company: str(row.company) ?? "Unknown",
      type: str(row.type),
      status: str(row.status) ?? str(row.statuscode),
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
    return {
      siteno: str(row.siteno) ?? siteno,
      sitename: str(row.sitename) ?? "Unknown Site",
      address: str(row.address),
      city: str(row.city),
      state: str(row.state),
      zip: str(row.zip),
      phone: str(row.phone),
    };
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
    return rows.map((r) => ({
      tbstarttime: str(r.tbstarttime),
      tbendtime: str(r.tbendtime),
      traveltime: str(r.traveltime),
      techassigned: str(r.techassigned),
    }));
  } finally {
    db.close();
  }
}

// Helpers

function str(val: unknown): string | null {
  if (val == null) return null;
  return String(val);
}

function normalizeDispatch(row: Record<string, unknown>): Dispatch {
  return {
    dispatchno: str(row.dispatchno) ?? "",
    callno: str(row.callno) ?? "",
    customerno: str(row.customerno) ?? "",
    siteno: str(row.siteno) ?? "",
    statuscode: str(row.statuscode) ?? str(row.status) ?? "UNKNOWN",
    problem: str(row.problem) ?? str(row.problemtype),
    solution: str(row.solution),
    priority: str(row.priority),
    techassigned: str(row.techassigned),
    date: str(row.date) ?? str(row.opendate) ?? str(row.calldate),
    closedate: str(row.closedate),
    estfixtime: str(row.estfixtime),
    callername: str(row.callername),
    calleremail: str(row.calleremail),
    callerphone: str(row.callerphone),
    description: str(row.description),
  };
}
