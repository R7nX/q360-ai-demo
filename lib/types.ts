/**
 * Shared TypeScript types for Q360 entities and AI tool contracts.
 *
 * All teams import from here — keep types in sync with Q360 API responses.
 * Field names are lowercase (Q360 returns uppercase; normalize with lowerKeys).
 */

// ──── Q360 Entities ────────────────────────────────────────────────────────

export interface Dispatch {
  dispatchno: string;
  customerno: string;
  siteno: string;
  machineno?: string;
  servicecontractno?: string;
  projectno?: string;
  techassigned: string;
  techassigned2?: string;
  statuscode: string;
  calltype: string;
  problemcode?: string;
  problem: string;
  solution?: string;
  callopendate: string;
  callstartdate?: string;
  closedate?: string;
  priority: number;
  branch: string;
  caller: string;
  calleremail?: string;
  csr?: string;
}

export interface Customer {
  customerno: string;
  company: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  salesrep?: string;
  status: string;
  balance?: number;
  ytdsales?: number;
}

export interface Contact {
  contactno: string;
  customerno: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  title?: string;
  status?: string;
}

export interface Site {
  siteno: string;
  customerno: string;
  sitename: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  zone?: string;
  status: string;
}

export interface Project {
  projectno: string;
  title: string;
  customerno: string;
  siteno?: string;
  projectleader?: string;
  statuscode: string;
  startdate?: string;
  enddate?: string;
  percentcomplete?: number;
  hoursbudget?: number;
  revenuebudget?: number;
  branch?: string;
}

export interface TimeBill {
  timebillno: string;
  userid: string;
  dispatchno?: string;
  customerno?: string;
  projectno?: string;
  date: string;
  endtime?: string;
  timebilled: number;
  rate?: number;
  category: string;
}

export interface ServiceContract {
  contractno: string;
  title: string;
  customerno: string;
  startdate: string;
  enddate: string;
  renewaldate?: string;
  statuscode: string;
  monthlytotal?: number;
  total?: number;
}

export interface User {
  userid: string;
  fullname: string;
  email?: string;
  type: string;
  branch?: string;
  department?: string;
  activeflag: string;
}

export interface Invoice {
  invoiceno: string;
  customerno: string;
  invoicedate: string;
  duedate?: string;
  invamount: number;
  balance: number;
  invoicetype?: string;
  salesperson?: string;
}

// ──── AI Tool API Contract ─────────────────────────────────────────────────

export type EntityType =
  | "dispatch"
  | "project"
  | "customer"
  | "servicecontract"
  | "timebill";

export type Audience = "manager" | "customer" | "technician" | "internal";

export type Tone = "formal" | "friendly" | "urgent";

export interface AiToolRequest {
  entityType: EntityType;
  entityId: string;
  intent: string;
  context?: Record<string, unknown>;
  audience?: Audience;
  tone?: Tone;
}

export interface AiToolResponse {
  success: boolean;
  result: {
    content: string;
    subject?: string;
    actions?: string[];
    metadata: {
      model: string;
      entityType: string;
      entityId: string;
    };
  };
  error?: string;
}
