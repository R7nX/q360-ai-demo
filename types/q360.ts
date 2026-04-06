/**
 * Q360 REST envelope types and normalized entity shapes used by `lib/q360`, `q360Client`, and routes.
 */

export interface Q360Response<T = unknown> {
  code: number;
  success: boolean;
  message: string;
  payload: T;
  outvars?: {
    primarykey?: string;
    _editguid?: string;
    reverttoken?: string;
    hasmore?: "Y" | "N";
  };
}

export interface Q360RecordListPayload {
  griddata: {
    record: Record<string, string | number | null>[];
  };
}

export interface Q360Filter {
  field: string;
  op: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like" | "isnull" | "isnotnull";
  value?: string;
}

export interface Q360OrderBy {
  field: string;
  dir: "ASC" | "DESC";
}

export interface Q360ListRequest {
  columns: string[];
  filters?: Q360Filter[];
  orderBy?: Q360OrderBy[];
  offset?: number;
  limit?: number;
}

// Core Q360 entities

export interface Dispatch {
  dispatchno: string;
  callno: string;
  customerno: string;
  siteno: string;
  statuscode: string;
  problem: string | null;
  solution: string | null;
  priority: string | null;
  techassigned: string | null;
  date: string | null;
  closedate: string | null;
  estfixtime: string | null;
  callername: string | null;
  calleremail: string | null;
  callerphone: string | null;
  description: string | null;
}

export interface Customer {
  customerno: string;
  company: string;
  type: string | null;
  status: string | null;
  phone?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  salesrep?: string | null;
  balance?: string | number | null;
  ytdsales?: string | number | null;
}

export interface Site {
  siteno: string;
  customerno?: string | null;
  sitename: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  zone?: string | null;
  status?: string | null;
}

export interface Project {
  projectno: string;
  title: string;
  customerno: string;
  siteno: string | null;
  projectleader: string | null;
  statuscode: string;
  startdate: string | null;
  enddate: string | null;
  percentcomplete: string | number | null;
  hoursbudget: string | number | null;
  revenuebudget: string | number | null;
  branch?: string | null;
}

export interface ServiceContract {
  contractno: string;
  title: string;
  customerno: string;
  siteno: string | null;
  startdate: string | null;
  enddate: string | null;
  renewaldate: string | null;
  statuscode: string;
  monthlytotal: string | number | null;
  total: string | number | null;
}

export interface TimeBill {
  timebillno?: string | null;
  userid?: string | null;
  dispatchno?: string | null;
  customerno?: string | null;
  projectno?: string | null;
  date?: string | null;
  endtime?: string | null;
  timebilled?: string | number | null;
  rate?: string | number | null;
  category?: string | null;
  tbstarttime: string | null;
  tbendtime: string | null;
  traveltime: string | null;
  techassigned: string | null;
}
