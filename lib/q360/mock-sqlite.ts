import type { Q360RecordRow } from "@/lib/domain/normalizers";
import { openReadonlySqliteDb } from "@/lib/sqlite";

export type MockSqliteFilter = {
  field: string;
  op: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like" | "isnull" | "isnotnull";
  value?: string | number | null;
};

export type MockSqliteOrderBy = {
  dir: "asc" | "desc";
  field: string;
};

export type MockSqliteRequest = {
  columns: string[];
  filters?: MockSqliteFilter[];
  limit?: number;
  offset?: number;
  orderBy?: MockSqliteOrderBy[];
};

export type MockSqliteRecordResult = {
  hasMore: boolean;
  limit: number;
  offset: number;
  rows: Q360RecordRow[];
  sourceName: string;
};

type MockSqliteListActionResult = {
  rows: Q360RecordRow[];
  sourceName: string;
};

const PROJECT_TABLE_CANDIDATES = [
  "PROJECT",
  "PROJECTS",
  "LDVIEW_PROJECT",
  "LDVIEW_PROJECTSNAPSHOT",
  "LDVIEW_PROJECTDETAIL",
] as const;

const TASK_TABLE_CANDIDATES = [
  "TASK",
  "TASKS",
  "LDVIEW_TASK",
  "TASKCONSOLEVIEW",
  "PROJECTSCHEDULE",
  "PROJECTTASKHISTORY",
] as const;

function escapeSqliteIdentifier(identifier: string): string {
  return identifier.replace(/"/g, "\"\"");
}

function buildSourceName(tableName: string): string {
  return `mock.db:${tableName}`;
}

function getRowValue(row: Q360RecordRow, fieldName: string): unknown | null {
  const directValue = row[fieldName];
  if (directValue !== undefined) {
    return directValue;
  }

  const lowerFieldName = fieldName.toLowerCase();
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase() === lowerFieldName) {
      return value;
    }
  }

  return null;
}

function normalizeRecordValue(value: unknown): string | number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isFinite(numericValue) && String(value).trim() !== "") {
    return numericValue;
  }

  return String(value);
}

function compareValues(left: unknown, right: unknown): number {
  const normalizedLeft = normalizeRecordValue(left);
  const normalizedRight = normalizeRecordValue(right);

  if (normalizedLeft === null && normalizedRight === null) {
    return 0;
  }
  if (normalizedLeft === null) {
    return 1;
  }
  if (normalizedRight === null) {
    return -1;
  }

  if (typeof normalizedLeft === "number" && typeof normalizedRight === "number") {
    return normalizedLeft - normalizedRight;
  }

  return String(normalizedLeft).localeCompare(String(normalizedRight));
}

function applyFilter(row: Q360RecordRow, filter: MockSqliteFilter): boolean {
  const value = getRowValue(row, filter.field);
  const normalizedValue = normalizeRecordValue(value);
  const normalizedFilterValue = normalizeRecordValue(filter.value);

  switch (filter.op) {
    case "=":
      return normalizedValue === normalizedFilterValue;
    case "!=":
      return normalizedValue !== normalizedFilterValue;
    case "<":
      return compareValues(normalizedValue, normalizedFilterValue) < 0;
    case ">":
      return compareValues(normalizedValue, normalizedFilterValue) > 0;
    case "<=":
      return compareValues(normalizedValue, normalizedFilterValue) <= 0;
    case ">=":
      return compareValues(normalizedValue, normalizedFilterValue) >= 0;
    case "isnull":
      return normalizedValue === null;
    case "isnotnull":
      return normalizedValue !== null;
    case "like": {
      if (normalizedValue === null || normalizedFilterValue === null) {
        return false;
      }

      const escapedPattern = String(normalizedFilterValue)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".");
      const matcher = new RegExp(`^${escapedPattern}$`, "i");
      return matcher.test(String(normalizedValue));
    }
  }
}

function normalizeTableName(value: string): string {
  return value.trim().toUpperCase();
}

function resolveTableName(
  availableTableNames: readonly string[],
  candidates: readonly string[],
): string | null {
  const normalizedTableNames = new Map(
    availableTableNames.map((tableName) => [normalizeTableName(tableName), tableName]),
  );

  for (const candidate of candidates) {
    const matchedTableName = normalizedTableNames.get(normalizeTableName(candidate));
    if (matchedTableName) {
      return matchedTableName;
    }
  }

  return null;
}

function readCandidateTableRows(
  candidates: readonly string[],
): { rows: Q360RecordRow[]; tableName: string } | null {
  const db = openReadonlySqliteDb();
  if (!db) {
    return null;
  }

  try {
    const availableTableNames = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;
    const tableName = resolveTableName(
      availableTableNames.map((row) => row.name),
      candidates,
    );

    if (!tableName) {
      return null;
    }

    const rows = db
      .prepare(`SELECT * FROM "${escapeSqliteIdentifier(tableName)}"`)
      .all() as Q360RecordRow[];

    return {
      rows,
      tableName,
    };
  } finally {
    db.close();
  }
}

function filterRowsByProjectNo(
  rows: Q360RecordRow[],
  projectNo: string | undefined,
): Q360RecordRow[] {
  if (!projectNo) {
    return rows;
  }

  return rows.filter((row) =>
    ["PROJECTNO", "PROJECTS_PROJECTNO", "LINKNO"].some(
      (fieldName) => String(getRowValue(row, fieldName) ?? "").trim() === projectNo,
    ),
  );
}

function sortRows(rows: Q360RecordRow[], orderBy: readonly MockSqliteOrderBy[]): Q360RecordRow[] {
  return [...rows].sort((left, right) => {
    for (const sortRule of orderBy) {
      const valueComparison = compareValues(
        getRowValue(left, sortRule.field),
        getRowValue(right, sortRule.field),
      );

      if (valueComparison !== 0) {
        return sortRule.dir === "desc" ? -valueComparison : valueComparison;
      }
    }

    return 0;
  });
}

export function listMockProjectRows(options: {
  projectNo?: string;
} = {}): MockSqliteListActionResult | null {
  const result = readCandidateTableRows(PROJECT_TABLE_CANDIDATES);
  if (!result) {
    return null;
  }

  return {
    rows: filterRowsByProjectNo(result.rows, options.projectNo),
    sourceName: buildSourceName(result.tableName),
  };
}

export function listMockTaskRows(options: {
  projectNo?: string;
} = {}): MockSqliteListActionResult | null {
  const result = readCandidateTableRows(TASK_TABLE_CANDIDATES);
  if (!result) {
    return null;
  }

  return {
    rows: filterRowsByProjectNo(result.rows, options.projectNo),
    sourceName: buildSourceName(result.tableName),
  };
}

export function listMockRecordRows(
  sourceName: string,
  request: MockSqliteRequest,
): MockSqliteRecordResult | null {
  const resolvedTableRows = readCandidateTableRows([sourceName]);
  if (!resolvedTableRows) {
    return null;
  }

  const filters = request.filters ?? [];
  const limit = request.limit ?? 100;
  const offset = request.offset ?? 0;
  const orderBy = request.orderBy ?? [];

  const filteredRows = resolvedTableRows.rows.filter((row) =>
    filters.every((filter) => applyFilter(row, filter)),
  );
  const sortedRows = sortRows(filteredRows, orderBy);
  const projectedRows = sortedRows.slice(offset, offset + limit).map((row) => {
    const projectedRow: Q360RecordRow = {};
    for (const column of request.columns) {
      projectedRow[column] = getRowValue(row, column);
    }
    return projectedRow;
  });

  return {
    hasMore: offset + limit < filteredRows.length,
    limit,
    offset,
    rows: projectedRows,
    sourceName: buildSourceName(resolvedTableRows.tableName),
  };
}
