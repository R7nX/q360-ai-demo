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
