import { allCandidateSources } from "@/lib/q360/candidate-sources";
import type {
  Q360DatasourceAccessItem,
  Q360FieldDefinition,
  Q360SourceKind,
  Q360TableListItem,
  Q360TableSchema,
} from "@/types/q360";

const VIEW_PREFIXES = [
  "BIVIEW_",
  "FVIEW_",
  "GRIDVIEW_",
  "LDVIEW_",
  "TASKCONSOLEVIEW",
];

const mockSearchOnlySources = [
  "CUSTOMERCONTACT",
  "CUSTOMERACCOUNT",
  "OPPORTUNITY",
  "QUOTE",
  "QUOTEITEM",
  "PROPOSAL",
  "ESTIMATE",
  "INVOICE",
  "INVOICEITEM",
  "SALESPIPELINE",
] as const;

function inferKind(sourceName: string): Q360SourceKind {
  const upperSource = sourceName.toUpperCase();
  if (VIEW_PREFIXES.some((prefix) => upperSource.startsWith(prefix))) {
    return "VIEW";
  }

  return "TABLE";
}

function inferPrimaryKey(sourceName: string): string {
  const upperSource = sourceName.toUpperCase();

  if (upperSource === "LDVIEW_TASK") {
    return "PROJECTSCHEDULENO";
  }
  if (upperSource === "PROJECTEVENTS") {
    return "PROJEVENTNO";
  }
  if (upperSource === "PROJECTTASKHISTORY") {
    return "HISTID";
  }
  if (upperSource.includes("CUSTOMER")) {
    return "CUSTOMERNO";
  }
  if (upperSource.includes("QUOTE")) {
    return "QUOTENO";
  }
  if (upperSource.includes("PROPOSAL")) {
    return "PROPOSALNO";
  }
  if (upperSource.includes("ESTIMATE")) {
    return "ESTIMATENO";
  }
  if (upperSource.includes("OPPORTUNITY")) {
    return "OPPORTUNITYNO";
  }
  if (upperSource.includes("INVOICE")) {
    return "INVOICENO";
  }
  if (upperSource.includes("TIMEBILL")) {
    return "TIMEBILLNO";
  }
  if (upperSource.includes("FORECAST")) {
    return "PROJECTFORECASTNO";
  }
  if (upperSource.includes("ITEM")) {
    return "PROJECTITEMNO";
  }
  if (upperSource.includes("TASK")) {
    return "TASKNO";
  }
  if (upperSource.includes("SCHEDULE")) {
    return "GLOBALSCHEDULENO";
  }
  if (upperSource.includes("PROJECT")) {
    return "PROJECTNO";
  }

  return "RECORDID";
}

function buildField(
  tableName: string,
  fieldName: string,
  overrides: Partial<Q360FieldDefinition> = {},
): Q360FieldDefinition {
  return {
    tableName,
    fieldName,
    fieldTitle: fieldName,
    webTitle: fieldName,
    fieldType: "C",
    sqlType: "VARCHAR",
    mandatory: false,
    isPrimaryKey: false,
    relatedTo: null,
    ...overrides,
  };
}

function buildSchema(sourceName: string): Q360TableSchema {
  const tableName = sourceName.toUpperCase();
  const primaryKey = inferPrimaryKey(sourceName);
  const fields: Q360FieldDefinition[] = [
    buildField(tableName, primaryKey, {
      fieldType: "C",
      isPrimaryKey: true,
      mandatory: true,
      sqlType: "VARCHAR",
    }),
  ];

  if (tableName === "LDVIEW_PROJECT") {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "DUEDATE", { fieldType: "D", sqlType: "DATETIME" }),
      buildField(tableName, "OWNERID"),
      buildField(tableName, "CUSTOMERNO", { relatedTo: "CUSTOMER.CUSTOMERNO" }),
      buildField(tableName, "CUSTOMER_COMPANY"),
      buildField(tableName, "MODDATE", { fieldType: "T", sqlType: "DATETIME" }),
    );
  } else if (tableName === "LDVIEW_TASK") {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "DUEDATE", { fieldType: "D", sqlType: "DATETIME" }),
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "OWNERID"),
      buildField(tableName, "COMMENT"),
      buildField(tableName, "MODDATE", { fieldType: "T", sqlType: "DATETIME" }),
    );
  } else if (tableName === "PROJECTEVENTS") {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "DATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "USERID", { relatedTo: "USERID.USERID" }),
      buildField(tableName, "COMMENT"),
      buildField(tableName, "TYPE"),
    );
  } else if (tableName === "PROJECTTASKHISTORY") {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "DATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "USERID", { relatedTo: "USERID.USERID" }),
      buildField(tableName, "COMMENT"),
      buildField(tableName, "TYPE"),
    );
  } else if (tableName === "GLOBALSCHEDULE") {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "STARTDATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "ENDDATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "USERID", { relatedTo: "USERID.USERID" }),
      buildField(tableName, "PROJECTS_PROJECTNO", {
        relatedTo: "PROJECTS.PROJECTNO",
      }),
      buildField(tableName, "LINKTYPE"),
      buildField(tableName, "LINKNO"),
    );
  } else if (tableName === "TIMEBILL" || tableName === "LDVIEW_TIMEBILLSUMMARY") {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "CUSTOMERNO", { relatedTo: "CUSTOMER.CUSTOMERNO" }),
      buildField(tableName, "DATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "TIMEBILLED", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "CATEGORY"),
      buildField(tableName, "DESCRIPTION"),
    );
  } else if (tableName === "LDVIEW_PROJECTHOURS") {
    fields.push(
      buildField(tableName, "TOTALHOURS", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "MODDATE", { fieldType: "T", sqlType: "DATETIME" }),
    );
  } else if (tableName.includes("CUSTOMER")) {
    fields.push(
      buildField(tableName, "COMPANY"),
      buildField(tableName, "STATUS"),
      buildField(tableName, "SALESPERSON"),
      buildField(tableName, "DEFCURRENCY"),
      buildField(tableName, "DEFPRICE"),
    );
  } else if (tableName.includes("PROFIT")) {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "REVENUE", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "COST", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "GROSSPROFIT", {
        fieldType: "N",
        sqlType: "NUMERIC",
      }),
      buildField(tableName, "GROSSMARGIN", {
        fieldType: "N",
        sqlType: "NUMERIC",
      }),
    );
  } else if (tableName.includes("FORECAST")) {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "FORECASTDATE", {
        fieldType: "T",
        sqlType: "DATETIME",
      }),
      buildField(tableName, "FORECASTAMOUNT", {
        fieldType: "N",
        sqlType: "NUMERIC",
      }),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "MODDATE", { fieldType: "T", sqlType: "DATETIME" }),
    );
  } else if (tableName.includes("ITEM")) {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "ITEMTYPE"),
      buildField(tableName, "COST", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "PRICE", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "STATUSCODE"),
    );
  } else if (tableName.includes("PROJECT")) {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "DUEDATE", { fieldType: "D", sqlType: "DATETIME" }),
      buildField(tableName, "OWNERID"),
      buildField(tableName, "CUSTOMERNO", { relatedTo: "CUSTOMER.CUSTOMERNO" }),
      buildField(tableName, "MODDATE", { fieldType: "T", sqlType: "DATETIME" }),
    );
  } else if (tableName.includes("TASK")) {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "DUEDATE", { fieldType: "D", sqlType: "DATETIME" }),
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "OWNERID"),
      buildField(tableName, "NOTES"),
    );
  } else if (tableName.includes("SCHEDULE")) {
    fields.push(
      buildField(tableName, "TITLE"),
      buildField(tableName, "STATUSCODE"),
      buildField(tableName, "STARTDATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "ENDDATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "USERID", { relatedTo: "USERID.USERID" }),
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
    );
  } else if (tableName.includes("TIMEBILL")) {
    fields.push(
      buildField(tableName, "PROJECTNO", { relatedTo: "PROJECTS.PROJECTNO" }),
      buildField(tableName, "CUSTOMERNO", { relatedTo: "CUSTOMER.CUSTOMERNO" }),
      buildField(tableName, "DATE", { fieldType: "T", sqlType: "DATETIME" }),
      buildField(tableName, "TIMEBILLED", { fieldType: "N", sqlType: "NUMERIC" }),
      buildField(tableName, "CATEGORY"),
    );
  } else {
    fields.push(buildField(tableName, "TITLE"), buildField(tableName, "STATUSCODE"));
  }

  return {
    tableName,
    primaryKey,
    fields,
  };
}

export const mockDatasourceAccessList: Q360DatasourceAccessItem[] =
  allCandidateSources.map((sourceName, index) => ({
    datasource: sourceName,
    sourcetype: inferKind(sourceName),
    accessflag: "Y",
    pkname: inferPrimaryKey(sourceName),
    userid: "MOCK_Q360_API",
    gridviewname: "",
    seq: String(index + 1),
    sqlreportdatasourcepermno: String(index + 100),
    tabledef_editcondition: null,
  }));

export const mockTableList: Q360TableListItem[] = Array.from(
  new Set([...allCandidateSources, ...mockSearchOnlySources]),
).map((sourceName) => ({
  table_dbf: sourceName,
  table_type: inferKind(sourceName),
}));

export const mockSchemas = new Map<string, Q360TableSchema>(
  allCandidateSources.map((sourceName) => [
    sourceName.toUpperCase(),
    buildSchema(sourceName),
  ]),
);
