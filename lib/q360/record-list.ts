import { z } from "zod";

import type { Q360RecordRow } from "@/lib/domain/normalizers";
import { fetchQ360Json } from "@/lib/q360/client";
import { hasFeature1PostgresDatabase, listMockRecordRows } from "@/lib/q360/mock-postgres";

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
    `Feature 1 requires an actual PostgreSQL table named ${normalizeSourceName(sourceName)} at DATABASE_URL.`,
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

  if (hasFeature1PostgresDatabase()) {
    const postgresResult = await listMockRecordRows(normalizedSourceName, request);
    if (!postgresResult) {
      throw buildMissingMockRecordSourceError(normalizedSourceName);
    }

    return postgresResult;
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
  let resolvedSourceName: string | null = null;

  while (pageCount < maxPages && rows.length < maxRows) {
    const page = await listQ360Records(sourceName, {
      ...request,
      limit,
      offset,
    });

    resolvedSourceName = page.sourceName;
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
    sourceName: resolvedSourceName ?? normalizeSourceName(sourceName),
  };
}
