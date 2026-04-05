#!/usr/bin/env tsx
/**
 * seed.ts
 *
 * Unified seed script for the Q360 AI Demo.
 *
 * Modes:
 *   npx tsx scripts/seed.ts                      Seed all tables with hardcoded story data
 *   npx tsx scripts/seed.ts list                 List available Q360 tables (requires API creds)
 *   npx tsx scripts/seed.ts profiles             List meaningful profile-backed tables
 *   npx tsx scripts/seed.ts <tablename> [count]  Schema-scrape a Q360 table and seed synthetic data
 *
 * Database target (controlled by USE_MOCK_DATA in .env.local):
 *   USE_MOCK_DATA=true   → SQLite (mock.db)
 *   USE_MOCK_DATA=false  → PostgreSQL (DATABASE_URL)
 */

import { faker } from "@faker-js/faker";
import { CUSTOMERS, SITES, DISPATCHES, TIMEBILLS, TASKS, daysAgo } from "./seed-data";
import {
  PROFILE_TABLES,
  SeedContext,
  SeedRow,
  buildProfileRows,
  createSeedContext,
  normalizeTableName,
} from "./seed-profiles";

// Load .env.local
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local not found — use system env
}

// ── Database Abstraction ─────────────────────────────────────────────────────

interface DbAdapter {
  exec(sql: string): Promise<void>;
  run(sql: string, params: unknown[]): Promise<void>;
  close(): Promise<void>;
}

async function createSqliteAdapter(dbPath: string): Promise<DbAdapter> {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(dbPath);
  return {
    async exec(sql) { db.exec(sql); },
    async run(sql, params) { db.prepare(sql).run(...params); },
    async close() { db.close(); },
  };
}

async function createPgAdapter(url: string): Promise<DbAdapter> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: url });
  await client.connect();
  return {
    async exec(sql) { await client.query(sql); },
    async run(sql, params) {
      let idx = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
      await client.query(pgSql, params);
    },
    async close() { await client.end(); },
  };
}

function getDbAdapter(): Promise<DbAdapter> {
  const useMock = process.env.USE_MOCK_DATA?.toLowerCase() === "true";

  if (useMock) {
    const dbPath = "mock.db";
    console.log(`  Target: SQLite (${dbPath})`);
    return createSqliteAdapter(dbPath);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("  USE_MOCK_DATA is false but DATABASE_URL is not set.");
    process.exit(1);
  }
  console.log(`  Target: PostgreSQL (${dbUrl.replace(/\/\/.*@/, "//***@")})`);
  return createPgAdapter(dbUrl);
}

// ── Q360 Schema Scraping (for dynamic table seeding) ─────────────────────────

const BASE_URL = process.env.Q360_BASE_URL;
const USERNAME = process.env.Q360_API_USERNAME;
const PASSWORD = process.env.Q360_API_PASSWORD;

function getAuthHeader(): string {
  if (!BASE_URL || !USERNAME || !PASSWORD) {
    console.error("  Missing Q360 API credentials (Q360_BASE_URL, Q360_API_USERNAME, Q360_API_PASSWORD).");
    console.error("  These are required for 'list' and dynamic table seeding.");
    process.exit(1);
  }
  return "Basic " + Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
}

interface Q360Column {
  name: string;
  type: string;
  nullable: boolean;
}

async function fetchColumns(table: string): Promise<Q360Column[]> {
  const url = `${BASE_URL}/api/DataDict?_a=list&tablename=${table}`;
  const res = await fetch(url, { headers: { Authorization: getAuthHeader() } });

  if (!res.ok) {
    throw new Error(`Q360 API returned ${res.status} ${res.statusText} for table "${table}"`);
  }

  const json = await res.json();
  const columns: unknown[] = json?.payload?.result ?? [];

  if (!columns.length) {
    throw new Error(
      `No columns returned for table "${table}". Check the table name and API access.`
    );
  }

  return columns.map((col) => {
    const c = col as Record<string, unknown>;
    return {
      name: (c.field_name as string) ?? "",
      type: (c.sqltype as string) ?? "VARCHAR",
      nullable: c.mandatoryflag !== "Y",
    };
  }).filter(c => c.name.length > 0);
}

async function listTables() {
  const url = `${BASE_URL}/api/DataDict?_a=tableList`;
  const res = await fetch(url, { headers: { Authorization: getAuthHeader() } });
  if (!res.ok) throw new Error(`Q360 API returned ${res.status} ${res.statusText}`);
  const json = await res.json();
  const tables: unknown[] = json?.payload?.result ?? [];
  if (!tables.length) throw new Error("No tables returned — check your API credentials.");
  console.log(`\n  Available Q360 tables (${tables.length}):\n`);
  for (const t of tables) {
    const obj = t as Record<string, unknown>;
    const name = typeof t === "string" ? t : String(obj.table_dbf ?? obj.tablename ?? obj.name ?? JSON.stringify(t));
    console.log(`    ${name}`);
  }
  console.log();
}

function listProfiles() {
  console.log("\n  Supported meaningful profile tables:\n");
  for (const table of PROFILE_TABLES) {
    console.log(`    ${table}`);
  }
  console.log();
}

// ── Synthetic Data Generation (for dynamic table seeding) ────────────────────

function toSQLiteType(datatype: string): "TEXT" | "INTEGER" | "REAL" {
  const t = datatype.toLowerCase();
  if (["int", "bigint", "smallint", "tinyint", "bit"].includes(t)) return "INTEGER";
  if (["decimal", "numeric", "float", "real", "money", "smallmoney"].includes(t)) return "REAL";
  return "TEXT";
}

const STATUS_CODES  = ["OPEN", "CLOSED", "PENDING", "IN PROGRESS", "ON HOLD", "CANCELLED"];
const PROBLEM_TYPES = ["HARDWARE", "SOFTWARE", "NETWORK", "ELECTRICAL", "MECHANICAL", "OTHER"];
const PRIORITIES    = [1, 2, 3, 4, 5];

function generateValue(
  col: Q360Column,
  tableName: string,
  ctx?: SeedContext,
  rowHint?: SeedRow
): string | number | null {
  const name       = col.name.toLowerCase();
  const sqliteType = toSQLiteType(col.type);

  if (ctx) {
    // Prefer relationship-aware values when we know story pools.
    if (name === "customerno") {
      if (rowHint?.SITENO) {
        const customerNo = ctx.sites.find((s) => String(s.SITENO) === String(rowHint.SITENO))?.CUSTOMERNO;
        if (customerNo != null) return String(customerNo);
      }
      return String(faker.helpers.arrayElement(ctx.customers).CUSTOMERNO);
    }
    if (name === "siteno") {
      if (rowHint?.CUSTOMERNO) {
        const sites = ctx.sitesByCustomer.get(String(rowHint.CUSTOMERNO)) ?? [];
        if (sites.length > 0) return String(faker.helpers.arrayElement(sites).SITENO);
      }
      return String(faker.helpers.arrayElement(ctx.sites).SITENO);
    }
    if (name === "dispatchno") return String(faker.helpers.arrayElement(ctx.dispatches).DISPATCHNO);
    if (name === "userid" || name === "employee" || name === "techassigned" || name === "assignedto") {
      return faker.helpers.arrayElement(ctx.users);
    }
    if (name === "projectno") return String(faker.helpers.arrayElement(ctx.projects).PROJECTNO);
    if (name === "taskid") return `TASK-${faker.string.numeric(5)}`;
    if (name === "machineno") return `MACH-${faker.string.numeric(5)}`;
  }

  if (col.nullable && (name.includes("solution") || name.includes("note") || name.includes("close"))) {
    if (Math.random() < 0.3) return null;
  }

  // Primary / foreign keys
  if (name.endsWith("no") && !name.includes("phone")) {
    const prefix = tableName.substring(0, 3).toUpperCase();
    return `${prefix}-${faker.string.alphanumeric(8).toUpperCase()}`;
  }
  if (name === "callno" || name === "dispatchno") {
    return `T${faker.string.numeric(12)}`;
  }

  // Status
  if (name === "statuscode" || name === "status") return faker.helpers.arrayElement(STATUS_CODES);
  if (name === "contype") return faker.helpers.arrayElement(["FULL", "PARTS", "LABOR", "PM"]);

  // Priority
  if (name === "priority") return faker.helpers.arrayElement(PRIORITIES);

  // Problem / solution
  if (name === "problem" || name === "problemtype") return faker.helpers.arrayElement(PROBLEM_TYPES);
  if (name === "solution") return faker.lorem.sentence({ min: 5, max: 15 });
  if (name.includes("description") || name.includes("note") || name.includes("detail")) {
    return faker.lorem.sentence();
  }

  // Technician
  if (name.includes("tech") && (name.includes("assign") || name === "techassigned")) {
    return faker.helpers.arrayElement([null, faker.person.fullName()]);
  }
  if (name.startsWith("tech")) return faker.person.fullName();

  // People / contacts
  if (name.includes("caller") && name.includes("name")) return faker.person.fullName();
  if (name.includes("email") || name.includes("mail")) return faker.internet.email();
  if (name.includes("phone") || name.includes("fax")) return faker.phone.number({ style: "national" });
  if (name.includes("firstname") || name === "first") return faker.person.firstName();
  if (name.includes("lastname")  || name === "last")  return faker.person.lastName();
  if (name === "fullname" || name.includes("contact")) return faker.person.fullName();

  // Company / customer
  if (name === "company" || name.includes("companyname")) return faker.company.name();
  if (name === "title" && normalizeTableName(tableName) === "PROJECTS") {
    return `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Project`;
  }
  if (name === "title") return faker.company.catchPhrase();

  // Location
  if (name.includes("address") || name === "addr") return faker.location.streetAddress();
  if (name === "city") return faker.location.city();
  if (name === "state") return faker.location.state({ abbreviated: true });
  if (name.includes("zip") || name.includes("postal")) return faker.location.zipCode();
  if (name.includes("country")) return "US";
  if (name === "zone") return faker.helpers.arrayElement(["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"]);

  // Dates and times
  if (name === "date" || name === "opendate" || name === "calldate") {
    return faker.date.recent({ days: 90 }).toISOString().split("T")[0];
  }
  if (name === "closedate") {
    return Math.random() < 0.4 ? faker.date.recent({ days: 30 }).toISOString().split("T")[0] : null;
  }
  if (name.includes("date") || name.includes("time")) {
    return faker.date.recent({ days: 180 }).toISOString().split("T")[0];
  }

  // Financial
  if (name.includes("price") || name.includes("rate") || name.includes("cost") || name.includes("amount")) {
    return faker.number.float({ min: 50, max: 5000, fractionDigits: 2 });
  }

  // Boolean flags
  if (sqliteType === "INTEGER" && (name.includes("flag") || name.includes("active") || name.includes("enable"))) {
    return faker.helpers.arrayElement([0, 1]);
  }

  // Fallback
  if (sqliteType === "INTEGER") return faker.number.int({ min: 0, max: 1000 });
  if (sqliteType === "REAL") return faker.number.float({ min: 0, max: 10000, fractionDigits: 2 });
  return faker.lorem.word();
}

// ── Seed: Story Data (default mode) ──────────────────────────────────────────

async function seedStoryData(db: DbAdapter) {
  const now = new Date();

  // Drop & create tables
  await db.exec(`DROP TABLE IF EXISTS timebill`);
  await db.exec(`DROP TABLE IF EXISTS tasks`);
  await db.exec(`DROP TABLE IF EXISTS dispatch`);
  await db.exec(`DROP TABLE IF EXISTS site`);
  await db.exec(`DROP TABLE IF EXISTS customer`);

  await db.exec(`
    CREATE TABLE customer (
      customerno TEXT PRIMARY KEY, company TEXT, type TEXT, status TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE site (
      siteno TEXT PRIMARY KEY, customerno TEXT, sitename TEXT,
      address TEXT, city TEXT, state TEXT, zip TEXT, phone TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE dispatch (
      dispatchno TEXT PRIMARY KEY, callno TEXT, customerno TEXT, siteno TEXT,
      statuscode TEXT, problem TEXT, solution TEXT, priority INTEGER,
      techassigned TEXT, date TEXT, closedate TEXT, estfixtime TEXT,
      callername TEXT, calleremail TEXT, callerphone TEXT, description TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE timebill (
      timebillno TEXT PRIMARY KEY, userid TEXT, dispatchno TEXT,
      customerno TEXT, date TEXT, timebilled REAL, rate REAL, category TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE tasks (
      TASKID TEXT PRIMARY KEY, USERID TEXT, TITLE TEXT,
      PRIORITY INTEGER, ENDDATE TEXT, COMPLETEDDATE TEXT
    )
  `);

  for (const c of CUSTOMERS) {
    await db.run(`INSERT INTO customer (customerno, company, type, status) VALUES (?, ?, ?, ?)`,
      [c.customerno, c.company, c.type, c.status]);
  }
  console.log(`  Seeded ${CUSTOMERS.length} customers`);

  for (const s of SITES) {
    await db.run(`INSERT INTO site (siteno, customerno, sitename, address, city, state, zip, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.siteno, s.customerno, s.sitename, s.address, s.city, s.state, s.zip, s.phone]);
  }
  console.log(`  Seeded ${SITES.length} sites`);

  for (const d of DISPATCHES) {
    const openDate = daysAgo(d.openDaysAgo, now);
    const closeDate = d.closeDaysAgo != null ? daysAgo(d.closeDaysAgo, now) : null;
    const estFixDate = daysAgo(d.estFixDaysAgo, now);
    await db.run(
      `INSERT INTO dispatch (dispatchno, callno, customerno, siteno, statuscode, problem, solution, priority, techassigned, date, closedate, estfixtime, callername, calleremail, callerphone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.dispatchno, d.callno, d.customerno, d.siteno, d.statuscode, d.problem, d.solution, d.priority, d.techassigned, openDate, closeDate, estFixDate, d.callername, d.calleremail, d.callerphone, d.description]
    );
  }
  console.log(`  Seeded ${DISPATCHES.length} dispatches`);

  for (const tb of TIMEBILLS) {
    await db.run(`INSERT INTO timebill (timebillno, userid, dispatchno, customerno, date, timebilled, rate, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tb.timebillno, tb.userid, tb.dispatchno, tb.customerno, daysAgo(tb.daysAgo, now), tb.timebilled, tb.rate, tb.category]);
  }
  console.log(`  Seeded ${TIMEBILLS.length} timebills`);

  for (const t of TASKS) {
    const endDate = daysAgo(-t.endDaysFromNow, now);
    const completedDate = t.completedDaysAgo != null ? daysAgo(t.completedDaysAgo, now) : null;
    await db.run(`INSERT INTO tasks (TASKID, USERID, TITLE, PRIORITY, ENDDATE, COMPLETEDDATE) VALUES (?, ?, ?, ?, ?, ?)`,
      [t.taskid, t.userid, t.title, t.priority, endDate, completedDate]);
  }
  console.log(`  Seeded ${TASKS.length} tasks`);

  console.log(`\n  Summary:`);
  console.log(`    ${CUSTOMERS.length} customers | ${SITES.length} sites | ${DISPATCHES.length} dispatches`);
  console.log(`    ${TIMEBILLS.length} timebills | ${TASKS.length} tasks`);
}

// ── Seed: Dynamic Table (schema-scraped from Q360) ───────────────────────────

async function seedDynamicTable(db: DbAdapter, rawTableName: string, requestedCount: number) {
  const tableName = normalizeTableName(rawTableName);
  const count = Number.isFinite(requestedCount) && requestedCount > 0 ? requestedCount : 20;
  // Story-derived pools that profile and fallback generators can both use.
  const ctx = createSeedContext(new Date());

  if (rawTableName !== tableName) {
    console.log(`\n  Normalized table name: ${rawTableName} -> ${tableName}`);
  }

  console.log(`\n  Fetching schema for "${tableName}" from Q360...`);

  const columns = await fetchColumns(tableName);
  console.log(`  Found ${columns.length} columns: ${columns.map((c) => c.name).join(", ")}\n`);

  // Build CREATE TABLE
  const colDefs = columns.map(c => `"${c.name}" ${toSQLiteType(c.type)}`).join(",\n    ");
  await db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
  await db.exec(`CREATE TABLE "${tableName}" (\n    ${colDefs}\n  )`);
  console.log(`  Created table "${tableName}"`);

  // Insert rows
  const colNames = columns.map(c => `"${c.name}"`).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;

  const profileRows = buildProfileRows(tableName, ctx, count);
  if (profileRows.length > 0) {
    console.log(`  Using meaningful profile generator for "${tableName}"`);
  } else {
    console.log(`  No profile for "${tableName}", using schema-based synthetic fallback`);
  }

  for (let i = 0; i < count; i++) {
    const profileRow = profileRows[i];
    const values = columns.map((c) => {
      const key = c.name.toUpperCase();
      if (profileRow && Object.prototype.hasOwnProperty.call(profileRow, key)) return profileRow[key];
      // Fill remaining columns with schema-aware fallback values.
      return generateValue(c, tableName, ctx, profileRow);
    });
    await db.run(sql, values);
  }

  console.log(`  Seeded ${count} rows into "${tableName}"`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg1 = process.argv[2];
  const arg2 = parseInt(process.argv[3] ?? "20", 10);

  // List mode — no DB needed
  if (arg1 === "list") {
    console.log("\n  Fetching table list from Q360...");
    await listTables();
    return;
  }

  if (arg1 === "profiles") {
    // Discovery mode for teammates: what tables have meaningful profile generators.
    listProfiles();
    return;
  }

  console.log();
  const db = await getDbAdapter();

  if (!arg1) {
    // Default: seed story data
    await seedStoryData(db);
  } else {
    // Dynamic: schema-scrape and seed a specific table
    await seedDynamicTable(db, arg1, arg2);
  }

  await db.close();
  console.log(`\n  Done. Restart your dev server to see the new data.\n`);
}

main().catch((err) => {
  console.error("\n  Seed failed:", err);
  process.exit(1);
});
