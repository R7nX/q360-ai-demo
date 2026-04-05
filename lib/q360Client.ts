/**
 * Typed HTTP helpers and bundled fallback entities when Q360 env vars or network are unavailable.
 */
import type {
  Q360Response,
  Q360RecordListPayload,
  Q360ListRequest,
  Dispatch,
  Customer,
  Site,
  TimeBill,
} from "@/types/q360";

const BASE_URL = process.env.Q360_BASE_URL || "http://rest.q360.online";
const USERNAME = process.env.Q360_API_USERNAME || "";
const PASSWORD = process.env.Q360_API_PASSWORD || "";

function authHeader(): string {
  const encoded = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Generic record list query against Q360 REST API.
 */
async function listRecords(
  tablename: string,
  request: Q360ListRequest
): Promise<Record<string, string | number | null>[]> {
  const formData = new FormData();
  formData.append("jsonRequest", JSON.stringify(request));

  const res = await fetch(
    `${BASE_URL}/api/Record/${tablename}?_a=list`,
    {
      method: "POST",
      headers: { Authorization: authHeader() },
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error(`Q360 API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Q360Response<Q360RecordListPayload>;

  if (!data.success) {
    throw new Error(`Q360 query failed: ${data.message}`);
  }

  return data.payload?.griddata?.record ?? [];
}

// ── Dispatch queries ──

const DISPATCH_COLUMNS = [
  "dispatchno",
  "callno",
  "customerno",
  "siteno",
  "statuscode",
  "problem",
  "solution",
  "priority",
  "techassigned",
  "date",
  "closedate",
  "estfixtime",
  "callername",
  "calleremail",
  "callerphone",
  "description",
];

export async function getDispatchList(
  statusFilter?: string
): Promise<Dispatch[]> {
  const request: Q360ListRequest = {
    columns: DISPATCH_COLUMNS,
    orderBy: [{ field: "date", dir: "DESC" }],
    offset: 0,
    limit: 50,
  };

  if (statusFilter) {
    request.filters = [{ field: "statuscode", op: "=", value: statusFilter }];
  }

  const rows = await listRecords("dispatch", request);
  return rows as unknown as Dispatch[];
}

export async function getDispatchById(
  dispatchno: string
): Promise<Dispatch | null> {
  const request: Q360ListRequest = {
    columns: DISPATCH_COLUMNS,
    filters: [{ field: "dispatchno", op: "=", value: dispatchno }],
    limit: 1,
  };

  const rows = await listRecords("dispatch", request);
  return rows.length > 0 ? (rows[0] as unknown as Dispatch) : null;
}

// ── Customer queries ──

export async function getCustomerByNo(
  customerno: string
): Promise<Customer | null> {
  const request: Q360ListRequest = {
    columns: ["customerno", "company", "type", "status"],
    filters: [{ field: "customerno", op: "=", value: customerno }],
    limit: 1,
  };

  const rows = await listRecords("customer", request);
  return rows.length > 0 ? (rows[0] as unknown as Customer) : null;
}

// ── Site queries ──

export async function getSiteByNo(siteno: string): Promise<Site | null> {
  const request: Q360ListRequest = {
    columns: [
      "siteno",
      "sitename",
      "address",
      "city",
      "state",
      "zip",
      "phone",
    ],
    filters: [{ field: "siteno", op: "=", value: siteno }],
    limit: 1,
  };

  const rows = await listRecords("site", request);
  return rows.length > 0 ? (rows[0] as unknown as Site) : null;
}

// ── Time Bill queries ──

export async function getTimeBillsByDispatch(
  dispatchno: string
): Promise<TimeBill[]> {
  const request: Q360ListRequest = {
    columns: ["tbstarttime", "tbendtime", "traveltime", "techassigned"],
    filters: [{ field: "dispatchno", op: "=", value: dispatchno }],
    orderBy: [{ field: "tbstarttime", dir: "ASC" }],
    limit: 20,
  };

  const rows = await listRecords("timebill", request);
  return rows as unknown as TimeBill[];
}

// ── Data formatting for AI prompts ──

export function formatDispatchForPrompt(
  dispatch: Dispatch,
  customer: Customer | null,
  site: Site | null,
  timeBills?: TimeBill[]
): string {
  const safe = (val: string | number | null | undefined) =>
    val != null && val !== "" ? String(val) : "[Not provided]";

  let text = `Service Call: ${safe(dispatch.dispatchno)}
Call Number: ${safe(dispatch.callno)}
Customer: ${safe(customer?.company)} (${safe(dispatch.customerno)})
Site: ${safe(site?.sitename)}
Site Address: ${safe(site?.address)}, ${safe(site?.city)}, ${safe(site?.state)} ${safe(site?.zip)}
Status: ${safe(dispatch.statuscode)}
Priority: ${safe(dispatch.priority)}
Problem Reported: ${safe(dispatch.problem)}
Solution Applied: ${safe(dispatch.solution)}
Technician Assigned: ${safe(dispatch.techassigned)}
Opened: ${safe(dispatch.date)}
Closed: ${safe(dispatch.closedate)}
Estimated Fix Time: ${safe(dispatch.estfixtime)}
Caller Name: ${safe(dispatch.callername)}
Caller Email: ${safe(dispatch.calleremail)}
Caller Phone: ${safe(dispatch.callerphone)}
Description: ${safe(dispatch.description)}`;

  if (timeBills && timeBills.length > 0) {
    text += "\n\nTime Entries:";
    for (const tb of timeBills) {
      text += `\n  - Tech: ${safe(tb.techassigned)}, Start: ${safe(tb.tbstarttime)}, End: ${safe(tb.tbendtime)}, Travel: ${safe(tb.traveltime)}`;
    }
  }

  return text;
}

// ── Fallback demo data ──

export const FALLBACK_DISPATCHES: Dispatch[] = [
  {
    dispatchno: "D-0009",
    callno: "C-10009",
    customerno: "CUST001",
    siteno: "SITE002",
    statuscode: "CLOSED",
    problem: "Rooftop HVAC unit making loud grinding noise. Urgent care patients complaining about noise and temperature fluctuations.",
    solution: "Replaced worn compressor bearings and recharged refrigerant to spec. System running at rated capacity, noise eliminated. Recommended scheduling preventive maintenance quarterly.",
    priority: "2",
    techassigned: "Maria Chen",
    date: "2026-03-16",
    closedate: "2026-03-19",
    estfixtime: "2026-03-19",
    callername: "Nancy Gill",
    calleremail: "n.gill@pinnaclehealth.org",
    callerphone: "(801) 555-1102",
    description: "HVAC grinding noise — urgent care",
  },
  {
    dispatchno: "D-0005",
    callno: "C-10005",
    customerno: "CUST006",
    siteno: "SITE014",
    statuscode: "IN PROGRESS",
    problem: "Elevator #2 stuck between floors 8 and 9. Guests safely evacuated via stairs. Hotel at 95% occupancy for convention weekend.",
    solution: null,
    priority: "2",
    techassigned: "James Rodriguez",
    date: "2026-03-28",
    closedate: null,
    estfixtime: "2026-04-02",
    callername: "Rachel Foster",
    calleremail: "r.foster@meridianhotels.com",
    callerphone: "(801) 555-6601",
    description: "Elevator stuck — hotel at near-full occupancy",
  },
  {
    dispatchno: "D-0011",
    callno: "C-10011",
    customerno: "CUST003",
    siteno: "SITE008",
    statuscode: "CLOSED",
    problem: "Smoke detector in the cafeteria kitchen triggering false alarms during lunch hours. Students being evacuated unnecessarily.",
    solution: "Replaced ionization detector with heat-rate-of-rise detector appropriate for kitchen environment. Tested with simulated cooking conditions — no false triggers. Updated zone map documentation.",
    priority: "2",
    techassigned: "Alex Kim",
    date: "2026-03-21",
    closedate: "2026-03-24",
    estfixtime: "2026-03-24",
    callername: "Julia Marsh",
    calleremail: "j.marsh@graniteschools.org",
    callerphone: "(801) 555-3303",
    description: "False fire alarms — elementary cafeteria",
  },
];

export const FALLBACK_CUSTOMERS: Record<string, Customer> = {
  CUST001: { customerno: "CUST001", company: "Pinnacle Health Systems", type: "Healthcare", status: "Active" },
  CUST003: { customerno: "CUST003", company: "Granite School District", type: "Education", status: "Active" },
  CUST006: { customerno: "CUST006", company: "Meridian Hotel Group", type: "Commercial", status: "Active" },
};

export const FALLBACK_SITES: Record<string, Site> = {
  SITE002: { siteno: "SITE002", sitename: "Pinnacle Urgent Care — Sandy", address: "9350 S 1300 E", city: "Sandy", state: "UT", zip: "84094", phone: "(801) 555-0102" },
  SITE008: { siteno: "SITE008", sitename: "Eastmont Elementary", address: "3190 E 7800 S", city: "Cottonwood Heights", state: "UT", zip: "84121", phone: "(801) 555-0303" },
  SITE014: { siteno: "SITE014", sitename: "Meridian Grand Hotel — Downtown", address: "75 S West Temple", city: "Salt Lake City", state: "UT", zip: "84101", phone: "(801) 555-0601" },
};
