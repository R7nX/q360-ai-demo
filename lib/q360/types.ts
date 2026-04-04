export type Q360SourceKind = "TABLE" | "VIEW" | "UNKNOWN";

export type Q360Envelope<TPayload> = {
  code?: number;
  success: boolean;
  message: string;
  payload: TPayload;
};

export type Q360ErrorItem = {
  seq?: string;
  __error?: string;
  errorno?: string;
  errormessage?: string;
  procname?: string;
  referencecode?: string;
  componentid?: string | null;
  linktype?: string | null;
  linkno?: string | null;
};

export type Q360DatasourceAccessItem = {
  datasource: string;
  sourcetype: Q360SourceKind;
  accessflag: string;
  pkname: string;
  userid: string;
  gridviewname: string;
  seq: string;
  sqlreportdatasourcepermno: string;
  tabledef_editcondition: string | null;
};

export type Q360TableListItem = {
  table_dbf: string;
  table_type: Q360SourceKind;
};

export type Q360FieldDefinition = {
  tableName: string;
  fieldName: string;
  fieldTitle: string | null;
  webTitle: string | null;
  fieldType: string | null;
  sqlType: string | null;
  mandatory: boolean;
  isPrimaryKey: boolean;
  relatedTo: string | null;
};

export type Q360TableSchema = {
  tableName: string;
  primaryKey: string | null;
  fields: Q360FieldDefinition[];
};
