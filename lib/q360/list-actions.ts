import { z } from "zod";

import type { Q360RecordRow } from "@/lib/domain/normalizers";
import { fetchQ360Json } from "@/lib/q360/client";
import {
  hasFeature1PostgresDatabase,
  listMockProjectRows,
  listMockTaskRows,
} from "@/lib/q360/mock-postgres";

type ListActionResult = {
  rows: Q360RecordRow[];
  sourceName: string;
};

type CacheEntry = {
  expiresAt: number;
  value: ListActionResult;
};

const rawListActionPayloadSchema = z.object({
  result: z.array(z.record(z.string(), z.unknown())),
});

const CACHE_TTL_MS = 30_000;
const PROJECT_TABLE_HINTS = [
  "PROJECTS",
  "LDVIEW_PROJECT",
] as const;
const TASK_TABLE_HINTS = [
  "PROJECTSCHEDULE",
  "LDVIEW_TASK",
  "TASKCONSOLEVIEW",
  "PROJECTTASKHISTORY",
  "TASK",
  "TASKS",
] as const;

const listActionCache = new Map<string, CacheEntry>();
const inFlightListActionRequests = new Map<string, Promise<ListActionResult>>();

function buildCacheKey(
  entityName: "Project" | "Task",
  options: { projectNo?: string } = {},
): string {
  const cacheScope = hasFeature1PostgresDatabase()
    ? `postgres:${process.env.DATABASE_URL ?? ""}`
    : `live:${process.env.Q360_BASE_URL ?? ""}:${process.env.Q360_API_USER ?? process.env.Q360_API_USERNAME ?? ""}`;

  return `${cacheScope}:${entityName}:${options.projectNo ?? ""}`;
}

function getCachedValue(cacheKey: string): ListActionResult | null {
  const cacheEntry = listActionCache.get(cacheKey);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    listActionCache.delete(cacheKey);
    return null;
  }

  return cacheEntry.value;
}

function setCachedValue(cacheKey: string, value: ListActionResult): void {
  listActionCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

export function clearListActionCache(): void {
  listActionCache.clear();
  inFlightListActionRequests.clear();
}

function buildListPath(
  entityName: "Project" | "Task",
  options: { projectNo?: string } = {},
): string {
  const searchParams = new URLSearchParams({ _a: "list" });

  if (options.projectNo) {
    searchParams.set("projectno", options.projectNo);
  }

  return `/api/${entityName}?${searchParams.toString()}`;
}

function sortRowsByDate(
  rows: Q360RecordRow[],
  dateFields: string[],
  direction: "asc" | "desc" = "asc",
): Q360RecordRow[] {
  return [...rows].sort((left, right) => {
    const leftValue = dateFields
      .map((fieldName) => left[fieldName])
      .find((value) => typeof value === "string" && value.length > 0);
    const rightValue = dateFields
      .map((fieldName) => right[fieldName])
      .find((value) => typeof value === "string" && value.length > 0);

    const leftTime = leftValue ? new Date(String(leftValue)).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = rightValue ? new Date(String(rightValue)).getTime() : Number.POSITIVE_INFINITY;

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }
    if (Number.isNaN(leftTime)) {
      return 1;
    }
    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return direction === "desc" ? rightTime - leftTime : leftTime - rightTime;
  });
}

function buildMissingMockTableError(
  entityName: "Project" | "Task",
  tableHints: readonly string[],
): Error {
  return new Error(
    `Feature 1 requires actual PostgreSQL table(s) for ${entityName} reads. Seed one of: ${tableHints.join(", ")}.`,
  );
}

export async function listProjectRows(
  options: { projectNo?: string } = {},
): Promise<ListActionResult> {
  const cacheKey = buildCacheKey("Project", options);
  const cachedValue = getCachedValue(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const inFlightRequest = inFlightListActionRequests.get(cacheKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const nextRequest = (async () => {
    if (hasFeature1PostgresDatabase()) {
      const postgresResult = await listMockProjectRows(options);
      if (!postgresResult) {
        throw buildMissingMockTableError("Project", PROJECT_TABLE_HINTS);
      }

      const result = {
        rows: sortRowsByDate(
          postgresResult.rows,
          ["enddate", "installdate", "startdate"],
          "asc",
        ),
        sourceName: postgresResult.sourceName,
      };

      setCachedValue(cacheKey, result);
      return result;
    }

    const response = await fetchQ360Json(
      buildListPath("Project", options),
      rawListActionPayloadSchema,
      { method: "GET" },
    );

    const result = {
      rows: sortRowsByDate(
        response.payload.result,
        ["enddate", "installdate", "startdate"],
        "asc",
      ),
      sourceName: "Project",
    } satisfies ListActionResult;

    setCachedValue(cacheKey, result);
    return result;
  })().finally(() => {
    inFlightListActionRequests.delete(cacheKey);
  });

  inFlightListActionRequests.set(cacheKey, nextRequest);
  return nextRequest;
}

export async function listTaskRows(
  options: { projectNo?: string } = {},
): Promise<ListActionResult> {
  const cacheKey = buildCacheKey("Task", options);
  const cachedValue = getCachedValue(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const inFlightRequest = inFlightListActionRequests.get(cacheKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const nextRequest = (async () => {
    if (hasFeature1PostgresDatabase()) {
      const postgresResult = await listMockTaskRows(options);
      if (!postgresResult) {
        throw buildMissingMockTableError("Task", TASK_TABLE_HINTS);
      }

      const result = {
        rows: sortRowsByDate(postgresResult.rows, ["enddate"], "asc"),
        sourceName: postgresResult.sourceName,
      };

      setCachedValue(cacheKey, result);
      return result;
    }

    const response = await fetchQ360Json(
      buildListPath("Task", options),
      rawListActionPayloadSchema,
      { method: "GET" },
    );

    const result = {
      rows: sortRowsByDate(response.payload.result, ["enddate"], "asc"),
      sourceName: "Task",
    } satisfies ListActionResult;

    setCachedValue(cacheKey, result);
    return result;
  })().finally(() => {
    inFlightListActionRequests.delete(cacheKey);
  });

  inFlightListActionRequests.set(cacheKey, nextRequest);
  return nextRequest;
}
