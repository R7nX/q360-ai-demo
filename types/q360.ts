// Q360 REST API response and entity types

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
}

export interface Site {
  siteno: string;
  sitename: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
}

export interface TimeBill {
  tbstarttime: string | null;
  tbendtime: string | null;
  traveltime: string | null;
  techassigned: string | null;
}
