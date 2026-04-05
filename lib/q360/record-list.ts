import { z } from "zod";

import type { Q360RecordRow } from "@/lib/domain/normalizers";
import { fetchQ360Json, isMockMode } from "@/lib/q360/client";
import { listMockRecordRows } from "@/lib/q360/mock-sqlite";

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

function buildMissingMockRecordSourceError(sourceName: string): Error {
  return new Error(
    `Mock mode requires an actual SQLite table named ${normalizeSourceName(sourceName)} in DATABASE_URL-backed mock.db.`,
  );
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
    const sqliteResult = listMockRecordRows(normalizedSourceName, request);
    if (!sqliteResult) {
      throw buildMissingMockRecordSourceError(normalizedSourceName);
    }

    return sqliteResult;
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
