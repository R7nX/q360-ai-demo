import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import type { Dispatch, Customer, Site, TimeBill } from "@/types/q360";

const DB_PATH = path.join(process.cwd(), "mock.db");
const DATABASE_URL = process.env.DATABASE_URL ?? "";
// USE_MOCK_DATA=true → local SQLite (mock.db), false → shared PostgreSQL (DATABASE_URL)
const USE_PG = process.env.USE_MOCK_DATA !== "true" && (DATABASE_URL.startsWith("postgresql://") || DATABASE_URL.startsWith("postgres://"));

// ── PostgreSQL ──

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: DATABASE_URL });
  }
  return _pool;
}

async function pgQuery<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await getPool().query(text, params);
  return rows as T[];
}

async function pgTableExists(table: string): Promise<boolean> {
  const rows = await pgQuery<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists`,
    [table]
  );
  return rows[0]?.exists ?? false;
}

// ── SQLite ──

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

// ── Exported functions ──

export async function getAllCustomersFromMockDb(): Promise<Record<string, Customer>> {
  if (USE_PG) {
    if (!(await pgTableExists("customer"))) return {};
    const rows = await pgQuery("SELECT * FROM customer");
    const map: Record<string, Customer> = {};
    for (const row of rows) {
      const r = lowerKeys(row);
      const no = str(r.customerno);
      if (!no) continue;
      map[no] = { customerno: no, company: str(r.company) ?? "Unknown", type: str(r.type), status: str(r.status) ?? str(r.statuscode) };
    }
    return map;
  }

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

export async function getAllSitesFromMockDb(): Promise<Record<string, Site>> {
  if (USE_PG) {
    if (!(await pgTableExists("site"))) return {};
    const rows = await pgQuery("SELECT * FROM site");
    const map: Record<string, Site> = {};
    for (const row of rows) {
      const r = lowerKeys(row);
      const no = str(r.siteno);
      if (!no) continue;
      map[no] = { siteno: no, sitename: str(r.sitename) ?? "Unknown Site", address: str(r.address), city: str(r.city), state: str(r.state), zip: str(r.zip), phone: str(r.phone) };
    }
    return map;
  }

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

export async function getDispatchesFromMockDb(): Promise<Dispatch[] | null> {
  if (USE_PG) {
    if (!(await pgTableExists("dispatch"))) return null;
    const rows = await pgQuery("SELECT * FROM dispatch ORDER BY date DESC LIMIT 50");
    return rows.map(normalizeDispatch);
  }

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

export async function getDispatchByIdFromMockDb(
  dispatchno: string
): Promise<Dispatch | null> {
  if (USE_PG) {
    if (!(await pgTableExists("dispatch"))) return null;
    let rows = await pgQuery("SELECT * FROM dispatch WHERE dispatchno = $1", [dispatchno]);
    if (rows.length === 0) {
      rows = await pgQuery("SELECT * FROM dispatch WHERE dispatchno LIKE $1", [`%${dispatchno}%`]);
    }
    return rows.length > 0 ? normalizeDispatch(rows[0]) : null;
  }

  const db = getDb();
  if (!db) return null;
  try {
    if (!hasTable(db, "dispatch")) return null;
    let row = db
      .prepare("SELECT * FROM dispatch WHERE dispatchno = ?")
      .get(dispatchno) as Record<string, unknown> | undefined;
    if (!row) {
      row = db
        .prepare("SELECT * FROM dispatch WHERE dispatchno LIKE ?")
        .get(`%${dispatchno}%`) as Record<string, unknown> | undefined;
    }
    return row ? normalizeDispatch(row) : null;
  } finally {
    db.close();
  }
}

export async function getCustomerFromMockDb(customerno: string): Promise<Customer | null> {
  if (USE_PG) {
    if (!(await pgTableExists("customer"))) return null;
    const rows = await pgQuery("SELECT * FROM customer WHERE customerno = $1", [customerno]);
    if (rows.length === 0) return null;
    const r = lowerKeys(rows[0]);
    return {
      customerno: str(r.customerno) ?? customerno,
      company: str(r.company) ?? "Unknown",
      type: str(r.type),
      status: str(r.status) ?? str(r.statuscode),
    };
  }

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

export async function getSiteFromMockDb(siteno: string): Promise<Site | null> {
  if (USE_PG) {
    if (!(await pgTableExists("site"))) return null;
    const rows = await pgQuery("SELECT * FROM site WHERE siteno = $1", [siteno]);
    if (rows.length === 0) return null;
    const r = lowerKeys(rows[0]);
    return {
      siteno: str(r.siteno) ?? siteno,
      sitename: str(r.sitename) ?? "Unknown Site",
      address: str(r.address),
      city: str(r.city),
      state: str(r.state),
      zip: str(r.zip),
      phone: str(r.phone),
    };
  }

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

export async function getTimeBillsFromMockDb(dispatchno: string): Promise<TimeBill[] | null> {
  if (USE_PG) {
    if (!(await pgTableExists("timebill"))) return null;
    const rows = await pgQuery("SELECT * FROM timebill WHERE dispatchno = $1", [dispatchno]);
    return rows.map((r) => ({
      tbstarttime: str(r.tbstarttime),
      tbendtime: str(r.tbendtime),
      traveltime: str(r.traveltime),
      techassigned: str(r.techassigned),
    }));
  }

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
