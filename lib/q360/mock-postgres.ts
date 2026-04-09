import { Pool } from "pg";

import type { Q360RecordRow } from "@/lib/domain/normalizers";

export type MockPostgresFilter = {
  field: string;
  op: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like" | "isnull" | "isnotnull";
  value?: string | number | null;
};

export type MockPostgresOrderBy = {
  dir: "asc" | "desc";
  field: string;
};

export type MockPostgresRequest = {
  columns: string[];
  filters?: MockPostgresFilter[];
  limit?: number;
  offset?: number;
  orderBy?: MockPostgresOrderBy[];
};

export type MockPostgresRecordResult = {
  hasMore: boolean;
  limit: number;
  offset: number;
  rows: Q360RecordRow[];
  sourceName: string;
};

type MockPostgresListActionResult = {
  rows: Q360RecordRow[];
  sourceName: string;
};

type TableReference = {
  schemaName: string;
  tableName: string;
};

type CacheEntry<TValue> = {
  expiresAt: number;
  value: TValue;
};

const PROJECT_TABLE_CANDIDATES = [
  "PROJECTS",
  "LDVIEW_PROJECT",
] as const;

const TASK_TABLE_CANDIDATES = [
  "PROJECTSCHEDULE",
  "LDVIEW_TASK",
  "TASKCONSOLEVIEW",
  "PROJECTTASKHISTORY",
  "TASK",
  "TASKS",
] as const;

const CACHE_TTL_MS = 30_000;

let cachedTableReferences: CacheEntry<TableReference[]> | null = null;
const cachedTableRows = new Map<string, CacheEntry<Q360RecordRow[]>>();
let pool: Pool | null = null;
let poolConnectionString: string | null = null;

export function hasFeature1PostgresDatabase(): boolean {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  return Boolean(databaseUrl && /^postgres(?:ql)?:\/\//i.test(databaseUrl));
}

function normalizeName(value: string): string {
  return value.trim().toUpperCase();
}

function buildSourceName(tableReference: TableReference): string {
  return tableReference.schemaName === "public"
    ? `postgres:${tableReference.tableName}`
    : `postgres:${tableReference.schemaName}.${tableReference.tableName}`;
}

function buildTableCacheKey(tableReference: TableReference): string {
  return `${tableReference.schemaName}.${tableReference.tableName}`;
}

function escapePostgresIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Feature 1 database reads require DATABASE_URL to be set.");
  }

  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error(
      "Feature 1 PostgreSQL reads require a PostgreSQL DATABASE_URL. SQLite is no longer supported for Feature 1.",
    );
  }

  return databaseUrl;
}

function getPool(): Pool {
  const databaseUrl = getDatabaseUrl();
  if (!pool || poolConnectionString !== databaseUrl) {
    if (pool) {
      void pool.end().catch(() => undefined);
    }

    pool = new Pool({ connectionString: databaseUrl });
    poolConnectionString = databaseUrl;
  }

  return pool;
}

function getCachedValue<TValue>(cacheEntry: CacheEntry<TValue> | null): TValue | null {
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    return null;
  }

  return cacheEntry.value;
}

function setCachedTableRows(tableCacheKey: string, rows: Q360RecordRow[]): void {
  cachedTableRows.set(tableCacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: rows,
  });
}

async function listAvailableTables(): Promise<TableReference[]> {
  const cachedTables = getCachedValue(cachedTableReferences);
  if (cachedTables) {
    return cachedTables;
  }

  const result = await getPool().query<{
    table_name: string;
    table_schema: string;
  }>(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY
      CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END,
      table_schema ASC,
      table_name ASC
  `);

  const tables = result.rows.map((row) => ({
    schemaName: row.table_schema,
    tableName: row.table_name,
  }));

  cachedTableReferences = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: tables,
  };

  return tables;
}

async function resolveTableReference(
  candidates: readonly string[],
): Promise<TableReference | null> {
  const tables = await listAvailableTables();
  const tableMap = new Map<string, TableReference>();
  for (const tableReference of tables) {
    const normalizedTableName = normalizeName(tableReference.tableName);
    if (!tableMap.has(normalizedTableName)) {
      tableMap.set(normalizedTableName, tableReference);
    }
  }

  for (const candidate of candidates) {
    const matchedTable = tableMap.get(normalizeName(candidate));
    if (matchedTable) {
      return matchedTable;
    }
  }

  return null;
}

async function readTableRows(tableReference: TableReference): Promise<Q360RecordRow[]> {
  const tableCacheKey = buildTableCacheKey(tableReference);
  const cachedRows = getCachedValue(cachedTableRows.get(tableCacheKey) ?? null);
  if (cachedRows) {
    return cachedRows;
  }

  const query = `
    SELECT *
    FROM ${escapePostgresIdentifier(tableReference.schemaName)}.${escapePostgresIdentifier(
      tableReference.tableName,
    )}
  `;
  const result = await getPool().query<Q360RecordRow>(query);
  const rows = result.rows as Q360RecordRow[];

  setCachedTableRows(tableCacheKey, rows);
  return rows;
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

function applyFilter(row: Q360RecordRow, filter: MockPostgresFilter): boolean {
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

function sortRows(
  rows: Q360RecordRow[],
  orderBy: readonly MockPostgresOrderBy[],
): Q360RecordRow[] {
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

export async function clearMockPostgresCache(): Promise<void> {
  cachedTableReferences = null;
  cachedTableRows.clear();

  if (pool) {
    const activePool = pool;
    pool = null;
    poolConnectionString = null;
    await activePool.end();
    return;
  }

  poolConnectionString = null;
}

export async function listMockProjectRows(options: {
  projectNo?: string;
} = {}): Promise<MockPostgresListActionResult | null> {
  const tableReference = await resolveTableReference(PROJECT_TABLE_CANDIDATES);
  if (!tableReference) {
    return null;
  }

  const rows = await readTableRows(tableReference);

  return {
    rows: filterRowsByProjectNo(rows, options.projectNo),
    sourceName: buildSourceName(tableReference),
  };
}

export async function listMockTaskRows(options: {
  projectNo?: string;
} = {}): Promise<MockPostgresListActionResult | null> {
  const tableReference = await resolveTableReference(TASK_TABLE_CANDIDATES);
  if (!tableReference) {
    return null;
  }

  const rows = await readTableRows(tableReference);

  return {
    rows: filterRowsByProjectNo(rows, options.projectNo),
    sourceName: buildSourceName(tableReference),
  };
}

export async function listMockRecordRows(
  sourceName: string,
  request: MockPostgresRequest,
): Promise<MockPostgresRecordResult | null> {
  const tableReference = await resolveTableReference([sourceName]);
  if (!tableReference) {
    return null;
  }

  const filters = request.filters ?? [];
  const limit = request.limit ?? 100;
  const offset = request.offset ?? 0;
  const orderBy = request.orderBy ?? [];
  const rows = await readTableRows(tableReference);
  const filteredRows = rows.filter((row) =>
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
    sourceName: buildSourceName(tableReference),
  };
}
