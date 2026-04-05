import { z } from "zod";

import type { Q360RecordRow } from "@/lib/domain/normalizers";
import { fetchQ360Json, isMockMode } from "@/lib/q360/client";
import { listMockRecordRows } from "@/lib/q360/mock-sqlite";
import { mockPhase1RowsBySource } from "@/mock/q360/phase1";

export type RecordListFilter = {
  field: string;
  op: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like" | "isnull" | "isnotnull";
  value?: string | number | null;
};

export type RecordListOrderBy = {
  dir: "asc" | "desc";
  field: string;
};

export type RecordListRequest = {
  columns: string[];
  filters?: RecordListFilter[];
  limit?: number;
  offset?: number;
  orderBy?: RecordListOrderBy[];
};

export type Q360RecordListResult = {
  hasMore: boolean;
  limit: number;
  offset: number;
  rows: Q360RecordRow[];
  sourceName: string;
};

const rawRecordListPayloadSchema = z.object({
  outvars: z
    .object({
      hasmore: z.string().optional(),
    })
    .passthrough()
    .optional(),
  result: z.array(z.record(z.string(), z.unknown())),
});

function normalizeSourceName(sourceName: string): string {
  return sourceName.trim().toUpperCase();
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

function applyFilter(row: Q360RecordRow, filter: RecordListFilter): boolean {
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

function applyMockQuery(
  sourceName: string,
  request: RecordListRequest,
): Q360RecordListResult {
  const normalizedSourceName = normalizeSourceName(sourceName);
  const sourceRows = mockPhase1RowsBySource[normalizedSourceName] ?? [];
  const filters = request.filters ?? [];
  const limit = request.limit ?? 100;
  const offset = request.offset ?? 0;
  const orderBy = request.orderBy ?? [];

  const filteredRows = sourceRows.filter((row) =>
    filters.every((filter) => applyFilter(row, filter)),
  );

  const sortedRows = [...filteredRows].sort((left, right) => {
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
    sourceName: `fixtures:${normalizedSourceName}`,
  };
}

export function createRecordListBody(request: RecordListRequest) {
  return {
    columns: request.columns,
    filters: request.filters ?? [],
    limit: request.limit ?? 100,
    offset: request.offset ?? 0,
    orderBy: request.orderBy ?? [],
  };
}

export async function listQ360Records(
  sourceName: string,
  request: RecordListRequest,
): Promise<Q360RecordListResult> {
  const normalizedSourceName = normalizeSourceName(sourceName);

  if (isMockMode()) {
    return (
      listMockRecordRows(normalizedSourceName, request) ??
      applyMockQuery(normalizedSourceName, request)
    );
  }

  const body = createRecordListBody(request);
  const response = await fetchQ360Json(
    `/api/Record/${encodeURIComponent(normalizedSourceName)}?_a=list`,
    rawRecordListPayloadSchema,
    {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  return {
    hasMore:
      String(response.payload.outvars?.hasmore ?? "N").toUpperCase() === "Y",
    limit: body.limit,
    offset: body.offset,
    rows: response.payload.result,
    sourceName: normalizedSourceName,
  };
}

export async function listAllQ360Records(
  sourceName: string,
  request: RecordListRequest & { maxPages?: number; maxRows?: number },
): Promise<Q360RecordListResult> {
  const limit = request.limit ?? 100;
  const maxPages = request.maxPages ?? 5;
  const maxRows = request.maxRows ?? limit * maxPages;
  const rows: Q360RecordRow[] = [];

  let offset = request.offset ?? 0;
  let pageCount = 0;
  let hasMore = false;

  while (pageCount < maxPages && rows.length < maxRows) {
    const page = await listQ360Records(sourceName, {
      ...request,
      limit,
      offset,
    });

    rows.push(...page.rows.slice(0, Math.max(maxRows - rows.length, 0)));
    pageCount += 1;
    hasMore = page.hasMore;

    if (!page.hasMore || page.rows.length < limit) {
      break;
    }

    offset += limit;
  }

  return {
    hasMore,
    limit,
    offset: request.offset ?? 0,
    rows,
    sourceName: normalizeSourceName(sourceName),
  };
}
