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

// Shared Q360 metadata and discovery types
// These live in the shared type surface because both the existing master-repo code
// and the Team 1 port need the same schema/access/envelope contracts. Keeping them
// here avoids a second parallel Q360 type namespace under lib/q360 and makes the
// integration surface easier to maintain across teams.

export type Q360SourceKind = "TABLE" | "VIEW" | "UNKNOWN";

export interface Q360Envelope<TPayload> {
  code?: number;
  success: boolean;
  message: string;
  payload: TPayload;
}

export interface Q360ErrorItem {
  seq?: string;
  __error?: string;
  errorno?: string;
  errormessage?: string;
  procname?: string;
  referencecode?: string;
  componentid?: string | null;
  linktype?: string | null;
  linkno?: string | null;
}

export interface Q360DatasourceAccessItem {
  datasource: string;
  sourcetype: Q360SourceKind;
  accessflag: string;
  pkname: string;
  userid: string;
  gridviewname: string;
  seq: string;
  sqlreportdatasourcepermno: string;
  tabledef_editcondition: string | null;
}

export interface Q360TableListItem {
  table_dbf: string;
  table_type: Q360SourceKind;
}

export interface Q360FieldDefinition {
  tableName: string;
  fieldName: string;
  fieldTitle: string | null;
  webTitle: string | null;
  fieldType: string | null;
  sqlType: string | null;
  mandatory: boolean;
  isPrimaryKey: boolean;
  relatedTo: string | null;
}

export interface Q360TableSchema {
  tableName: string;
  primaryKey: string | null;
  fields: Q360FieldDefinition[];
}

// Shared Q360 entity types
// This section intentionally forms a superset of the older service-oriented mock
// layer and the broader Team 1 manager schema from the master plan. That keeps
// the current port stable while aligning future PostgreSQL-backed pages to one
// shared contract.

export interface Dispatch {
  dispatchno: string;
  callno?: string | null;
  customerno: string;
  siteno: string;
  machineno?: string | null;
  servicecontractno?: string | null;
  projectno?: string | null;
  techassigned?: string | null;
  techassigned2?: string | null;
  statuscode: string;
  calltype?: string | null;
  problemcode?: string | null;
  problem: string | null;
  solution: string | null;
  callopendate?: string | null;
  callstartdate?: string | null;
  date?: string | null;
  closedate: string | null;
  priority: string | null;
  branch?: string | null;
  caller?: string | null;
  callername?: string | null;
  calleremail?: string | null;
  callerphone?: string | null;
  csr?: string | null;
  estfixtime?: string | null;
  description?: string | null;
}

export interface Customer {
  customerno: string;
  company: string;
  phone?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  salesrep?: string | null;
  status: string | null;
  balance?: string | number | null;
  ytdsales?: string | number | null;
  type?: string | null;
}

export interface Site {
  siteno: string;
  customerno?: string | null;
  sitename: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone?: string | null;
  zone?: string | null;
  status?: string | null;
}

export interface Project {
  projectno: string;
  title: string;
  customerno: string;
  siteno?: string | null;
  projectleader?: string | null;
  salesrep?: string | null;
  statuscode: string;
  startdate?: string | null;
  enddate?: string | null;
  percentcomplete?: string | number | null;
  hoursbudget?: string | number | null;
  revenuebudget?: string | number | null;
  branch?: string | null;
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
  tbstarttime?: string | null;
  tbendtime?: string | null;
  traveltime?: string | null;
  techassigned?: string | null;
}

export interface ServiceContract {
  contractno: string;
  title: string;
  customerno: string;
  siteno?: string | null;
  startdate: string | null;
  enddate: string | null;
  renewaldate?: string | null;
  statuscode: string;
  monthlytotal?: string | number | null;
  total?: string | number | null;
}

export interface User {
  userid: string;
  fullname: string;
  email?: string | null;
  type: string;
  branch?: string | null;
  department?: string | null;
  activeflag: string;
}

export interface Invoice {
  invoiceno: string;
  customerno: string;
  invoicedate: string;
  duedate?: string | null;
  invamount: string | number | null;
  balance: string | number | null;
  invoicetype?: string | null;
  statuscode?: string | null;
}
