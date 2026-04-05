/**
 * Q360 REST API client.
 *
 * All Q360 API calls go through this module so credentials stay server-side.
 * Import the convenience functions (getDispatches, getProjects, etc.) or use
 * the generic q360Query() for custom queries.
 */

const BASE_URL = process.env.Q360_BASE_URL!;
const USERNAME = process.env.Q360_API_USERNAME!;
const PASSWORD = process.env.Q360_API_PASSWORD!;

const AUTH_HEADER = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`;

// ──── Types ────────────────────────────────────────────────────────────────

export interface Q360Filter {
  field: string;
  op: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like" | "isnull" | "isnotnull";
  value: string;
}

export interface Q360QueryOptions {
  columns?: string[];
  filters?: Q360Filter[];
  orderBy?: { field: string; dir: "ASC" | "DESC" }[];
  offset?: number;
  limit?: number;
}

export interface Q360Result<T = Record<string, unknown>> {
  result: T[];
  total: number;
  hasMore: boolean;
}

// ──── Generic Query ────────────────────────────────────────────────────────

export async function q360Query<T = Record<string, unknown>>(
  tableName: string,
  options: Q360QueryOptions = {},
): Promise<Q360Result<T>> {
  const body = new FormData();
  body.append(
    "jsonRequest",
    JSON.stringify({
      columns: options.columns ?? [],
      filters: options.filters ?? [],
      orderBy: options.orderBy ?? [],
      offset: options.offset ?? 0,
      limit: options.limit ?? 100,
    }),
  );

  const res = await fetch(`${BASE_URL}/api/Record/${tableName}?_a=list`, {
    method: "POST",
    headers: { Authorization: AUTH_HEADER },
    body,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Q360 query failed");

  return {
    result: json.payload.result as T[],
    total: json.payload.total ?? 0,
    hasMore: json.outvars?.hasmore === "Y",
  };
}

// ──── Convenience Functions ────────────────────────────────────────────────

export async function getDispatches(filters?: Q360Filter[], limit?: number) {
  return q360Query("Dispatch", {
    columns: [
      "DISPATCHNO", "CUSTOMERNO", "SITENO", "STATUSCODE", "PROBLEM",
      "TECHASSIGNED", "CALLOPENDATE", "PRIORITY", "CALLTYPE", "CALLER",
      "CALLEREMAIL", "SOLUTION", "CLOSEDATE", "CSR", "BRANCH",
    ],
    filters,
    orderBy: [{ field: "CALLOPENDATE", dir: "DESC" }],
    limit,
  });
}

export async function getProjects(filters?: Q360Filter[], limit?: number) {
  return q360Query("Projects", {
    columns: [
      "PROJECTNO", "TITLE", "CUSTOMERNO", "STATUSCODE",
      "PERCENTCOMPLETE", "STARTDATE", "ENDDATE", "PROJECTLEADER",
      "HOURSBUDGET", "REVENUEBUDGET", "BRANCH",
    ],
    filters,
    orderBy: [{ field: "STARTDATE", dir: "DESC" }],
    limit,
  });
}

export async function getCustomers(filters?: Q360Filter[], limit?: number) {
  return q360Query("Customer", {
    columns: [
      "CUSTOMERNO", "COMPANY", "PHONE", "ADDRESS1", "CITY", "STATE", "ZIP",
      "SALESREP", "STATUS", "BALANCE", "YTDSALES",
    ],
    filters,
    limit,
  });
}

export async function getContacts(filters?: Q360Filter[], limit?: number) {
  return q360Query("Contact", {
    columns: [
      "CONTACTNO", "CUSTOMERNO", "FIRSTNAME", "LASTNAME", "EMAIL",
      "PHONE", "TITLE", "STATUS",
    ],
    filters,
    limit,
  });
}

export async function getTimeBills(filters?: Q360Filter[], limit?: number) {
  return q360Query("Timebill", {
    columns: [
      "TIMEBILLNO", "USERID", "DISPATCHNO", "CUSTOMERNO", "PROJECTNO",
      "DATE", "ENDTIME", "TIMEBILLED", "RATE", "CATEGORY",
    ],
    filters,
    limit,
  });
}

export async function getServiceContracts(filters?: Q360Filter[], limit?: number) {
  return q360Query("Servicecontract", {
    columns: [
      "CONTRACTNO", "TITLE", "CUSTOMERNO", "STARTDATE", "ENDDATE",
      "RENEWALDATE", "STATUSCODE", "MONTHLYTOTAL", "TOTAL",
    ],
    filters,
    limit,
  });
}

export async function getSites(filters?: Q360Filter[], limit?: number) {
  return q360Query("Site", {
    columns: [
      "SITENO", "CUSTOMERNO", "SITENAME", "ADDRESS", "CITY",
      "STATE", "ZIP", "ZONE", "STATUS",
    ],
    filters,
    limit,
  });
}

export async function getUsers(filters?: Q360Filter[], limit?: number) {
  return q360Query("Userid", {
    columns: [
      "USERID", "FULLNAME", "EMAIL", "TYPE", "BRANCH",
      "DEPARTMENT", "ACTIVEFLAG",
    ],
    filters,
    limit,
  });
}

export async function getInvoices(filters?: Q360Filter[], limit?: number) {
  return q360Query("Invoice", {
    columns: [
      "INVOICENO", "CUSTOMERNO", "INVOICEDATE", "DUEDATE",
      "INVAMOUNT", "BALANCE", "INVOICETYPE", "SALESPERSON",
    ],
    filters,
    limit,
  });
}
