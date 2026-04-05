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
