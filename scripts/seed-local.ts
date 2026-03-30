#!/usr/bin/env tsx
/**
 * seed-local.ts
 *
 * Seeds a local SQLite mock.db with realistic dispatch, customer, and site
 * data — no Q360 API credentials needed.
 *
 * Usage:
 *   npx tsx scripts/seed-local.ts
 */

import Database from "better-sqlite3";
import { faker } from "@faker-js/faker";

const DB_PATH = "mock.db";
const DISPATCH_COUNT = 20;
const CUSTOMER_COUNT = 10;
const SITE_COUNT = 12;

const db = new Database(DB_PATH);

// ── Create tables ──

db.exec(`DROP TABLE IF EXISTS dispatch`);
db.exec(`DROP TABLE IF EXISTS customer`);
db.exec(`DROP TABLE IF EXISTS site`);

db.exec(`
  CREATE TABLE customer (
    customerno TEXT PRIMARY KEY,
    company TEXT,
    type TEXT,
    status TEXT
  )
`);

db.exec(`
  CREATE TABLE site (
    siteno TEXT PRIMARY KEY,
    sitename TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT
  )
`);

db.exec(`
  CREATE TABLE dispatch (
    dispatchno TEXT PRIMARY KEY,
    callno TEXT,
    customerno TEXT,
    siteno TEXT,
    statuscode TEXT,
    problem TEXT,
    solution TEXT,
    priority INTEGER,
    techassigned TEXT,
    date TEXT,
    closedate TEXT,
    estfixtime TEXT,
    callername TEXT,
    calleremail TEXT,
    callerphone TEXT,
    description TEXT
  )
`);

// ── Seed customers ──

const COMPANY_TYPES = ["Commercial", "Industrial", "Government", "Healthcare", "Education"];
const customers: { customerno: string; company: string }[] = [];

const insertCustomer = db.prepare(
  `INSERT INTO customer (customerno, company, type, status) VALUES (?, ?, ?, ?)`
);

for (let i = 1; i <= CUSTOMER_COUNT; i++) {
  const customerno = `CUST${String(i).padStart(3, "0")}`;
  const company = faker.company.name();
  customers.push({ customerno, company });
  insertCustomer.run(
    customerno,
    company,
    faker.helpers.arrayElement(COMPANY_TYPES),
    faker.helpers.weightedArrayElement([
      { value: "Active", weight: 8 },
      { value: "Inactive", weight: 2 },
    ])
  );
}

console.log(`Seeded ${CUSTOMER_COUNT} customers`);

// ── Seed sites ──

const sites: { siteno: string; sitename: string }[] = [];
const SITE_TYPES = [
  "Main Office", "Warehouse", "Data Center", "Branch Office",
  "Manufacturing Plant", "Retail Store", "Distribution Center",
  "Corporate HQ", "Medical Center", "Campus Building",
];

const insertSite = db.prepare(
  `INSERT INTO site (siteno, sitename, address, city, state, zip, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (let i = 1; i <= SITE_COUNT; i++) {
  const siteno = `SITE${String(i).padStart(3, "0")}`;
  const sitename = `${faker.company.name()} - ${faker.helpers.arrayElement(SITE_TYPES)}`;
  sites.push({ siteno, sitename });
  insertSite.run(
    siteno,
    sitename,
    faker.location.streetAddress(),
    faker.location.city(),
    faker.location.state({ abbreviated: true }),
    faker.location.zipCode(),
    faker.phone.number({ style: "national" })
  );
}

console.log(`Seeded ${SITE_COUNT} sites`);

// ── Seed dispatches ──

const STATUSES = ["OPEN", "CLOSED", "IN PROGRESS", "PENDING", "ON HOLD"];
const PROBLEMS = [
  "HVAC unit not cooling properly. Temperature rising in server room.",
  "Elevator stuck on 3rd floor. Passengers safely evacuated.",
  "Fire alarm panel showing fault codes across multiple zones.",
  "Electrical panel overheating. Breaker tripping intermittently.",
  "Security camera system offline. No footage recording.",
  "Plumbing leak detected in ceiling above lobby area.",
  "Generator failed to start during scheduled test run.",
  "Access control system not recognizing employee badges.",
  "Lighting fixtures flickering in parking garage level 2.",
  "Rooftop exhaust fan making grinding noise. Possible bearing failure.",
  "UPS system battery low warning. Backup power at risk.",
  "Water heater not producing hot water. Tenant complaints.",
  "Automatic doors not closing properly. Safety concern.",
  "Sprinkler system pressure drop detected in east wing.",
  "Refrigeration unit temperature alarm in kitchen area.",
];

const SOLUTIONS = [
  "Replaced faulty compressor and recharged refrigerant. System tested and operating within normal parameters.",
  "Replaced motor control board and realigned door tracks. All floors tested successfully.",
  "Replaced smoke detector in Zone 3, reset panel. All zones testing clear.",
  "Tightened loose connections, replaced damaged breaker. Thermal scan shows normal temps.",
  "Replaced failed NVR hard drive, updated firmware. All cameras back online and recording.",
  "Identified burst pipe joint, replaced section. Ceiling tile replaced, area dried.",
  "Replaced starter motor and battery. Generator ran full 30-minute load test successfully.",
  "Reset controller, updated firmware, re-enrolled affected badges. System operational.",
  "Replaced ballasts in affected fixtures. All lights functioning normally.",
  "Replaced worn bearings and belt. Fan balanced and running smoothly.",
  "Replaced battery bank, ran full discharge test. UPS holding at 100% capacity.",
  "Replaced heating element and thermostat. Water temp verified at proper setting.",
  "Adjusted sensors and replaced worn weather stripping. Doors closing properly.",
  "Found and repaired leaking test valve. System pressure restored to spec.",
  "Replaced thermostat sensor and cleaned condenser coils. Temperature holding steady.",
];

const TECHS = [
  "Maria Chen", "James Rodriguez", "Alex Kim", "Sarah Thompson",
  "Mike Johnson", "Lisa Park", "David Wilson", "Rachel Green",
];

const insertDispatch = db.prepare(`
  INSERT INTO dispatch (
    dispatchno, callno, customerno, siteno, statuscode, problem, solution,
    priority, techassigned, date, closedate, estfixtime, callername,
    calleremail, callerphone, description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 1; i <= DISPATCH_COUNT; i++) {
  const dispatchno = `D-${String(i).padStart(4, "0")}`;
  const callno = `C-${faker.string.numeric(5)}`;
  const customer = faker.helpers.arrayElement(customers);
  const site = faker.helpers.arrayElement(sites);
  const status = faker.helpers.weightedArrayElement([
    { value: "CLOSED", weight: 5 },
    { value: "OPEN", weight: 3 },
    { value: "IN PROGRESS", weight: 2 },
    { value: "PENDING", weight: 1 },
  ]);

  const problemIdx = faker.number.int({ min: 0, max: PROBLEMS.length - 1 });
  const problem = PROBLEMS[problemIdx];
  const solution = status === "CLOSED" ? SOLUTIONS[problemIdx % SOLUTIONS.length] : null;

  const openDate = faker.date.recent({ days: 60 });
  const closedate =
    status === "CLOSED"
      ? new Date(openDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 86400000)
          .toISOString()
          .split("T")[0]
      : null;

  const estFixDays = faker.number.int({ min: 1, max: 7 });
  const estfixtime = new Date(openDate.getTime() + estFixDays * 86400000)
    .toISOString()
    .split("T")[0];

  const tech = faker.helpers.weightedArrayElement([
    { value: faker.helpers.arrayElement(TECHS), weight: 8 },
    { value: null, weight: 2 },
  ]);

  const callerFirst = faker.person.firstName();
  const callerLast = faker.person.lastName();

  insertDispatch.run(
    dispatchno,
    callno,
    customer.customerno,
    site.siteno,
    status,
    problem,
    solution,
    faker.helpers.arrayElement([1, 2, 3, 4]),
    tech,
    openDate.toISOString().split("T")[0],
    closedate,
    estfixtime,
    `${callerFirst} ${callerLast}`,
    faker.internet.email({ firstName: callerFirst, lastName: callerLast }),
    faker.phone.number({ style: "national" }),
    problem.split(".")[0] // Short description from first sentence
  );
}

db.close();

console.log(`Seeded ${DISPATCH_COUNT} dispatches`);
console.log(`\nDatabase ready: ${DB_PATH}`);
console.log(`Restart your dev server and records will appear in the dropdown.`);
