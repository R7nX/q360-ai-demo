/**
 * seed-profiles.ts
 *
 * Profile-backed row builders for high-value tables.
 * These generators prioritize relationship coherence (customer/site/dispatch/user)
 * over pure randomness so demo data is more believable.
 */

import { faker } from "@faker-js/faker";
import {
  CUSTOMERS,
  SITES,
  DISPATCHES,
  TIMEBILLS,
  TASKS,
  TECHNICIANS,
  daysAgo,
} from "./seed-data";

export type SeedValue = string | number | null;
export type SeedRow = Record<string, SeedValue>;

export interface SeedContext {
  now: Date;
  customers: SeedRow[];
  sites: SeedRow[];
  dispatches: SeedRow[];
  timebills: SeedRow[];
  tasks: SeedRow[];
  projects: SeedRow[];
  users: string[];
  sitesByCustomer: Map<string, SeedRow[]>;
}

type ProfileBuilder = (ctx: SeedContext, count: number) => SeedRow[];

export const PROFILE_TABLES = [
  "CUSTOMER",
  "SITE",
  "DISPATCH",
  "TIMEBILL",
  "TASKS",
  "EMPSCHEDULE",
  "GLOBALSCHEDULE",
  "MACHINE",
  "LDVIEW_TASK",
  "TASKCONSOLEVIEW",
  "PROJECTSCHEDULE",
  "PROJECTTASKHISTORY",
] as const;

/** Canonicalizes table names so profile lookup is stable. */
export function normalizeTableName(table: string): string {
  return table.trim().toUpperCase();
}

function pick<T>(items: T[]): T {
  return items[faker.number.int({ min: 0, max: items.length - 1 })];
}

function addDaysIso(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function materializeRows(baseRows: SeedRow[], count: number, idFields: string[]): SeedRow[] {
  if (baseRows.length === 0) return [];
  const rows: SeedRow[] = [];
  for (let i = 0; i < count; i++) {
    const cycle = Math.floor(i / baseRows.length);
    const row = { ...baseRows[i % baseRows.length] };
    if (cycle > 0) {
      for (const idField of idFields) {
        if (row[idField] != null) row[idField] = `${row[idField]}-X${cycle + 1}`;
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Builds reusable in-memory pools from story data.
 * Dynamic/profile seeding uses this context to keep FK-like values coherent.
 */
export function createSeedContext(now = new Date()): SeedContext {
  const customers: SeedRow[] = CUSTOMERS.map((c) => ({
    CUSTOMERNO: c.customerno,
    COMPANY: c.company,
    TYPE: c.type,
    STATUS: c.status,
  }));

  const sites: SeedRow[] = SITES.map((s) => ({
    SITENO: s.siteno,
    CUSTOMERNO: s.customerno,
    SITENAME: s.sitename,
    ADDRESS: s.address,
    CITY: s.city,
    STATE: s.state,
    ZIP: s.zip,
    PHONE: s.phone,
  }));

  const dispatches: SeedRow[] = DISPATCHES.map((d) => ({
    DISPATCHNO: d.dispatchno,
    CALLNO: d.callno,
    CUSTOMERNO: d.customerno,
    SITENO: d.siteno,
    STATUSCODE: d.statuscode,
    PROBLEM: d.problem,
    SOLUTION: d.solution,
    PRIORITY: d.priority,
    TECHASSIGNED: d.techassigned,
    DATE: daysAgo(d.openDaysAgo, now),
    CLOSEDATE: d.closeDaysAgo != null ? daysAgo(d.closeDaysAgo, now) : null,
    ESTFIXTIME: daysAgo(d.estFixDaysAgo, now),
  }));

  const timebills: SeedRow[] = TIMEBILLS.map((tb) => ({
    TIMEBILLNO: tb.timebillno,
    USERID: tb.userid,
    DISPATCHNO: tb.dispatchno,
    CUSTOMERNO: tb.customerno,
    DATE: daysAgo(tb.daysAgo, now),
    TIMEBILLED: tb.timebilled,
    RATE: tb.rate,
    CATEGORY: tb.category,
  }));

  const tasks: SeedRow[] = TASKS.map((t) => ({
    TASKID: t.taskid,
    USERID: t.userid,
    TITLE: t.title,
    PRIORITY: t.priority,
    ENDDATE: daysAgo(-t.endDaysFromNow, now),
    COMPLETEDDATE: t.completedDaysAgo != null ? daysAgo(t.completedDaysAgo, now) : null,
    STATUSCODE: t.completedDaysAgo != null ? "CLOSED" : "OPEN",
  }));

  const users = Array.from(new Set(TECHNICIANS.map((t) => t.name)));

  const projects: SeedRow[] = Array.from({ length: 16 }, (_, i) => {
    const site = sites[i % sites.length];
    return {
      PROJECTNO: `P-${String(i + 1).padStart(4, "0")}`,
      TITLE: `${site.SITENAME} Upgrade`,
      CUSTOMERNO: site.CUSTOMERNO,
      SITENO: site.SITENO,
      STATUSCODE: pick(["ACTIVE", "ACTIVE", "PLANNING", "ON HOLD", "COMPLETE"]),
      STARTDATE: addDaysIso(now, -faker.number.int({ min: 5, max: 45 })),
      ENDDATE: addDaysIso(now, faker.number.int({ min: 7, max: 90 })),
      PERCENTCOMPLETE: faker.number.int({ min: 5, max: 100 }),
      PROJECTLEADER: pick(users),
      PRIORITY: faker.number.int({ min: 1, max: 4 }),
    };
  });

  const sitesByCustomer = new Map<string, SeedRow[]>();
  for (const site of sites) {
    const key = String(site.CUSTOMERNO);
    const list = sitesByCustomer.get(key);
    if (list) list.push(site);
    else sitesByCustomer.set(key, [site]);
  }

  return { now, customers, sites, dispatches, timebills, tasks, projects, users, sitesByCustomer };
}

// Table-specific meaningful generators. If a table is missing here,
// seed.ts falls back to schema-based synthetic generation.
const PROFILE_BUILDERS: Record<string, ProfileBuilder> = {
  CUSTOMER: (ctx, count) => materializeRows(ctx.customers, count, ["CUSTOMERNO"]),
  SITE: (ctx, count) => materializeRows(ctx.sites, count, ["SITENO"]),
  DISPATCH: (ctx, count) => materializeRows(ctx.dispatches, count, ["DISPATCHNO", "CALLNO"]),
  TIMEBILL: (ctx, count) => materializeRows(ctx.timebills, count, ["TIMEBILLNO"]),
  TASKS: (ctx, count) => materializeRows(ctx.tasks, count, ["TASKID"]),
  MACHINE: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const site = ctx.sites[i % ctx.sites.length];
    const machineType = pick(["Air Handler", "Water Pump", "Generator", "Elevator Controller", "Panelboard"]);
    return {
      MACHINENO: `MACH-${String(i + 1).padStart(4, "0")}`,
      CUSTOMERNO: site.CUSTOMERNO,
      SITENO: site.SITENO,
      STATUS: pick(["ACTIVE", "ACTIVE", "INACTIVE"]),
      STATUSCODE: pick(["ACTIVE", "ACTIVE", "INACTIVE"]),
      DESCRIPTION: `${machineType} at ${site.SITENAME}`,
      MODEL: `${machineType} ${faker.string.alphanumeric(4).toUpperCase()}`,
      SERIALNO: `SN-${faker.string.alphanumeric(8).toUpperCase()}`,
      INSTALLDATE: addDaysIso(ctx.now, -faker.number.int({ min: 120, max: 1500 })),
    };
  }),
  EMPSCHEDULE: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const user = ctx.users[i % ctx.users.length];
    const site = ctx.sites[i % ctx.sites.length];
    const dispatch = ctx.dispatches[i % ctx.dispatches.length];
    const dayOffset = i % 14;
    return {
      EMPSCHEDULENO: `ES-${String(i + 1).padStart(4, "0")}`,
      USERID: user,
      DATE: addDaysIso(ctx.now, dayOffset),
      STARTDATE: addDaysIso(ctx.now, dayOffset),
      ENDDATE: addDaysIso(ctx.now, dayOffset),
      STARTTIME: pick(["07:00", "08:00", "09:00"]),
      ENDTIME: pick(["15:30", "16:30", "17:30"]),
      STATUSCODE: pick(["CONFIRMED", "CONFIRMED", "PLANNED"]),
      SITENO: site.SITENO,
      CUSTOMERNO: site.CUSTOMERNO,
      DISPATCHNO: dispatch.DISPATCHNO,
      TITLE: "On-site service block",
    };
  }),
  GLOBALSCHEDULE: (ctx, count) => Array.from({ length: count }, (_, i) => ({
    GLOBALSCHEDULENO: `GS-${String(i + 1).padStart(4, "0")}`,
    DATE: addDaysIso(ctx.now, i % 14),
    STARTDATE: addDaysIso(ctx.now, i % 14),
    ENDDATE: addDaysIso(ctx.now, i % 14),
    STARTTIME: pick(["06:00", "07:00", "08:00"]),
    ENDTIME: pick(["15:00", "16:00", "17:00"]),
    STATUSCODE: pick(["ACTIVE", "ACTIVE", "PLANNED"]),
    TITLE: pick(["Regional Coverage", "After-Hours Coverage", "On-Call Rotation"]),
  })),
  LDVIEW_TASK: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const task = ctx.tasks[i % ctx.tasks.length];
    const dispatch = ctx.dispatches[i % ctx.dispatches.length];
    return {
      TASKID: task.TASKID,
      USERID: task.USERID,
      TITLE: task.TITLE,
      PRIORITY: task.PRIORITY,
      STATUSCODE: task.COMPLETEDDATE ? "CLOSED" : "OPEN",
      DISPATCHNO: dispatch.DISPATCHNO,
      CUSTOMERNO: dispatch.CUSTOMERNO,
      SITENO: dispatch.SITENO,
      ENDDATE: task.ENDDATE,
      COMPLETEDDATE: task.COMPLETEDDATE,
    };
  }),
  TASKCONSOLEVIEW: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const task = ctx.tasks[i % ctx.tasks.length];
    const dispatch = ctx.dispatches[i % ctx.dispatches.length];
    return {
      TASKID: task.TASKID,
      USERID: task.USERID,
      TITLE: task.TITLE,
      PRIORITY: task.PRIORITY,
      STATUSCODE: task.COMPLETEDDATE ? "CLOSED" : "OPEN",
      QUEUE: task.COMPLETEDDATE ? "COMPLETED" : pick(["TODAY", "THIS WEEK", "OVERDUE"]),
      DISPATCHNO: dispatch.DISPATCHNO,
      CUSTOMERNO: dispatch.CUSTOMERNO,
      SITENO: dispatch.SITENO,
      LASTUPDATED: addDaysIso(ctx.now, -faker.number.int({ min: 0, max: 4 })),
    };
  }),
  PROJECTSCHEDULE: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const project = ctx.projects[i % ctx.projects.length];
    const start = faker.number.int({ min: -30, max: 30 });
    return {
      PROJECTSCHEDULENO: `PS-${String(i + 1).padStart(4, "0")}`,
      PROJECTNO: project.PROJECTNO,
      TITLE: `${project.TITLE} - ${pick(["Planning", "Procurement", "Install", "QA", "Closeout"])}`,
      STATUSCODE: pick(["PLANNED", "ACTIVE", "ACTIVE", "ON HOLD", "COMPLETE"]),
      STARTDATE: addDaysIso(ctx.now, start),
      ENDDATE: addDaysIso(ctx.now, start + faker.number.int({ min: 3, max: 21 })),
      CUSTOMERNO: project.CUSTOMERNO,
      SITENO: project.SITENO,
      OWNER: pick(ctx.users),
      PRIORITY: faker.number.int({ min: 1, max: 4 }),
    };
  }),
  PROJECTTASKHISTORY: (ctx, count) => Array.from({ length: count }, (_, i) => {
    const project = ctx.projects[i % ctx.projects.length];
    const [from, to] = pick([
      ["OPEN", "IN PROGRESS"],
      ["IN PROGRESS", "WAITING PARTS"],
      ["WAITING PARTS", "IN PROGRESS"],
      ["IN PROGRESS", "DONE"],
    ]);
    return {
      HISTORYID: `PTH-${String(i + 1).padStart(5, "0")}`,
      PROJECTNO: project.PROJECTNO,
      TASKID: `PT-${String((i % 200) + 1).padStart(4, "0")}`,
      EVENTDATE: addDaysIso(ctx.now, -faker.number.int({ min: 1, max: 40 })),
      STATUSFROM: from,
      STATUSTO: to,
      CHANGEDBY: pick(ctx.users),
      USERID: pick(ctx.users),
      CUSTOMERNO: project.CUSTOMERNO,
      SITENO: project.SITENO,
      NOTE: `Moved from ${from} to ${to} after field update`,
    };
  }),
};

/** Returns profile-generated rows for a table, or [] if no profile exists. */
export function buildProfileRows(tableName: string, ctx: SeedContext, count: number): SeedRow[] {
  const builder = PROFILE_BUILDERS[tableName];
  if (!builder) return [];
  return builder(ctx, count);
}
