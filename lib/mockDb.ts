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
  } finally { db.close(); }
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
      map[no] = { siteno: no, sitename: str(r.sitename) ?? "Unknown Site", address: str(r.address), city: str(r.city), state: str(r.state), zip: str(r.zip), phone: str(r.phone) };
    }
    return map;
  } finally { db.close(); }
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
    callername: str(r.callername),
    calleremail: str(r.calleremail),
    callerphone: str(r.callerphone),
    description: str(r.description),
  };
}
