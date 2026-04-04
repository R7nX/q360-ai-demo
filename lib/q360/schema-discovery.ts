import { z } from "zod";

import {
  allCandidateSources,
  businessAreaDefinitions,
  businessAreaLabels,
  type BusinessAreaKey,
} from "@/lib/q360/candidate-sources";
import {
  fetchQ360Json,
  getQ360DocumentationUrl,
  isMockMode,
} from "@/lib/q360/client";
import {
  mockDatasourceAccessList,
  mockSchemas,
  mockTableList,
} from "@/mock/q360/phase0";
import type {
  Q360DatasourceAccessItem,
  Q360FieldDefinition,
  Q360SourceKind,
  Q360TableListItem,
  Q360TableSchema,
} from "@/lib/q360/types";

const CACHE_TTL_MS = 5 * 60_000;
const MATCH_SAMPLE_LIMIT = 8;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type SchemaSummary = {
  fieldCount: number | null;
  primaryKey: string | null;
  sampleFields: string[];
  schemaError: string | null;
};

type CacheKey = string;

const discoveryCache = new Map<CacheKey, CacheEntry>();

const rawDatasourceAccessItemSchema = z.object({
  accessflag: z.string(),
  datasource: z.string(),
  gridviewname: z.string().catch(""),
  pkname: z.string().catch("RECORDID"),
  seq: z.string().catch("0"),
  sourcetype: z.string().catch("UNKNOWN"),
  sqlreportdatasourcepermno: z.string().catch("0"),
  tabledef_editcondition: z.string().nullable().optional(),
  userid: z.string(),
});

const rawDatasourceAccessPayloadSchema = z.object({
  result: z.array(rawDatasourceAccessItemSchema),
});

const rawTableListPayloadSchema = z.object({
  result: z.array(
    z.object({
      table_dbf: z.string(),
      table_type: z.string().catch("UNKNOWN"),
    }),
  ),
});

const rawFieldDefinitionSchema = z
  .object({
    field_name: z.string(),
    field_title: z.string().nullable().optional(),
    field_web_title: z.string().nullable().optional(),
    field_type: z.string().nullable().optional(),
    mandatoryflag: z.string().nullable().optional(),
    p_key: z.string().nullable().optional(),
    relatedto: z.string().nullable().optional(),
    sqltype: z.string().nullable().optional(),
    table_dbf: z.string().nullable().optional(),
  })
  .passthrough();

const rawTableSchemaPayloadSchema = z.object({
  result: z.array(rawFieldDefinitionSchema),
});

function normalizeSourceKind(sourceKind: string): Q360SourceKind {
  const upperKind = sourceKind.toUpperCase();
  if (upperKind === "TABLE" || upperKind === "VIEW") {
    return upperKind;
  }

  return "UNKNOWN";
}

function normalizeSourceName(sourceName: string): string {
  return sourceName.trim().toUpperCase();
}

function getCachedValue<TValue>(cacheKey: CacheKey): TValue | null {
  const cacheEntry = discoveryCache.get(cacheKey);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    discoveryCache.delete(cacheKey);
    return null;
  }

  return cacheEntry.value as TValue;
}

function setCachedValue(cacheKey: CacheKey, value: unknown): void {
  discoveryCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function getSourceAreaCountMap(): Map<string, number> {
  return new Map(
    allCandidateSources.map((sourceName) => [
      normalizeSourceName(sourceName),
      Object.values(businessAreaDefinitions).filter((definition) =>
        (definition.candidateSources as readonly string[]).includes(sourceName),
      ).length,
    ]),
  );
}

function getMatchedTerms(sourceName: string, searchTerms: readonly string[]): string[] {
  const normalizedSourceName = normalizeSourceName(sourceName);
  return searchTerms.filter((term) => normalizedSourceName.includes(term));
}

function compareMatchedSources(
  left: DiscoverySearchMatch,
  right: DiscoverySearchMatch,
): number {
  if (left.shortlisted !== right.shortlisted) {
    return left.shortlisted ? -1 : 1;
  }

  if (left.kind !== right.kind) {
    return left.kind === "VIEW" ? -1 : 1;
  }

  if (left.matchedTerms.length !== right.matchedTerms.length) {
    return right.matchedTerms.length - left.matchedTerms.length;
  }

  return left.sourceName.localeCompare(right.sourceName);
}

function buildRecommendedSource(
  candidates: DiscoverySourceSummary[],
  matchedSources: DiscoverySearchMatch[],
): string | null {
  return (
    candidates.find(
      (candidate) =>
        candidate.accessible &&
        candidate.exists &&
        candidate.kind === "VIEW" &&
        candidate.schemaError === null,
    )?.sourceName ??
    candidates.find(
      (candidate) =>
        candidate.exists &&
        candidate.kind === "VIEW" &&
        candidate.schemaError === null,
    )?.sourceName ??
    candidates.find(
      (candidate) =>
        candidate.accessible && candidate.exists && candidate.schemaError === null,
    )?.sourceName ??
    candidates.find(
      (candidate) => candidate.exists && candidate.schemaError === null,
    )?.sourceName ??
    matchedSources[0]?.sourceName ??
    null
  );
}

function buildSchemaSummaries(
  includeSchemas: boolean,
  tableMap: Map<string, Q360TableListItem>,
): Promise<Map<string, SchemaSummary>> {
  if (!includeSchemas) {
    return Promise.resolve(new Map<string, SchemaSummary>());
  }

  return Promise.allSettled(
    allCandidateSources.map(async (sourceName) => {
      const normalizedSourceName = normalizeSourceName(sourceName);
      if (!tableMap.has(normalizedSourceName)) {
        return {
          schemaSummary: {
            fieldCount: null,
            primaryKey: null,
            sampleFields: [],
            schemaError: "Source not present in table list.",
          },
          sourceName: normalizedSourceName,
        };
      }

      const schema = await getTableSchema(sourceName);
      return {
        schemaSummary: {
          fieldCount: schema.fields.length,
          primaryKey: schema.primaryKey,
          sampleFields: schema.fields.slice(0, 5).map((field) => field.fieldName),
          schemaError: null,
        },
        sourceName: normalizedSourceName,
      };
    }),
  ).then((schemaResults) => {
    const schemaSummaries = new Map<string, SchemaSummary>();

    for (let index = 0; index < schemaResults.length; index += 1) {
      const sourceName = normalizeSourceName(allCandidateSources[index]);
      const schemaResult = schemaResults[index];

      if (schemaResult.status === "fulfilled") {
        schemaSummaries.set(sourceName, schemaResult.value.schemaSummary);
      } else {
        schemaSummaries.set(sourceName, {
          fieldCount: null,
          primaryKey: null,
          sampleFields: [],
          schemaError:
            schemaResult.reason instanceof Error
              ? schemaResult.reason.message
              : "Schema request failed.",
        });
      }
    }

    return schemaSummaries;
  });
}

export function clearQ360DiscoveryCache(): void {
  discoveryCache.clear();
}

export async function getDatasourceAccessList(
  userId = process.env.Q360_API_USER ?? "",
): Promise<Q360DatasourceAccessItem[]> {
  const cacheKey = `access:${normalizeSourceName(userId)}`;
  const cachedAccessList = getCachedValue<Q360DatasourceAccessItem[]>(cacheKey);
  if (cachedAccessList) {
    return cachedAccessList;
  }

  let accessList: Q360DatasourceAccessItem[];
  if (isMockMode()) {
    accessList = mockDatasourceAccessList;
  } else {
    const response = await fetchQ360Json(
      `/api/UserID?_a=datasourceAccessList&userid=${encodeURIComponent(userId)}`,
      rawDatasourceAccessPayloadSchema,
      { method: "GET" },
    );

    accessList = response.payload.result.map((source) => ({
      accessflag: source.accessflag,
      datasource: normalizeSourceName(source.datasource),
      gridviewname: source.gridviewname,
      pkname: normalizeSourceName(source.pkname),
      seq: source.seq,
      sourcetype: normalizeSourceKind(source.sourcetype),
      sqlreportdatasourcepermno: source.sqlreportdatasourcepermno,
      tabledef_editcondition: source.tabledef_editcondition ?? null,
      userid: source.userid,
    }));
  }

  setCachedValue(cacheKey, accessList);
  return accessList;
}

export async function getTableList(): Promise<Q360TableListItem[]> {
  const cacheKey = "table-list";
  const cachedTableList = getCachedValue<Q360TableListItem[]>(cacheKey);
  if (cachedTableList) {
    return cachedTableList;
  }

  let tableList: Q360TableListItem[];
  if (isMockMode()) {
    tableList = mockTableList;
  } else {
    const response = await fetchQ360Json(
      "/api/DataDict?_a=tableList",
      rawTableListPayloadSchema,
      { method: "GET" },
    );

    tableList = response.payload.result.map((source) => ({
      table_dbf: normalizeSourceName(source.table_dbf),
      table_type: normalizeSourceKind(source.table_type),
    }));
  }

  setCachedValue(cacheKey, tableList);
  return tableList;
}

export async function getTableSchema(
  tableName: string,
): Promise<Q360TableSchema> {
  const normalizedTableName = normalizeSourceName(tableName);
  const cacheKey = `schema:${normalizedTableName}`;
  const cachedSchema = getCachedValue<Q360TableSchema>(cacheKey);
  if (cachedSchema) {
    return cachedSchema;
  }

  let tableSchema: Q360TableSchema;
  if (isMockMode()) {
    const mockSchema = mockSchemas.get(normalizedTableName);
    if (!mockSchema) {
      throw new Error(`Mock schema not found for ${normalizedTableName}.`);
    }

    tableSchema = mockSchema;
  } else {
    const response = await fetchQ360Json(
      `/api/DataDict?_a=list&tablename=${encodeURIComponent(normalizedTableName)}`,
      rawTableSchemaPayloadSchema,
      { method: "GET" },
    );

    const fields: Q360FieldDefinition[] = response.payload.result.map((field) => ({
      fieldName: normalizeSourceName(field.field_name),
      fieldTitle: field.field_title ?? null,
      fieldType: field.field_type ?? null,
      isPrimaryKey: ["T", "Y", "TRUE"].includes(
        String(field.p_key ?? "").toUpperCase(),
      ),
      mandatory: String(field.mandatoryflag ?? "").toUpperCase() === "Y",
      relatedTo: field.relatedto ?? null,
      sqlType: field.sqltype ?? null,
      tableName: normalizeSourceName(field.table_dbf ?? normalizedTableName),
      webTitle: field.field_web_title ?? null,
    }));

    tableSchema = {
      fields,
      primaryKey: fields.find((field) => field.isPrimaryKey)?.fieldName ?? null,
      tableName: normalizedTableName,
    };
  }

  setCachedValue(cacheKey, tableSchema);
  return tableSchema;
}

export type DiscoverySourceSummary = {
  accessible: boolean;
  areaCount: number;
  exists: boolean;
  fieldCount: number | null;
  kind: Q360SourceKind;
  primaryKey: string | null;
  sampleFields: string[];
  schemaError: string | null;
  sourceName: string;
};

export type DiscoverySearchMatch = {
  kind: Q360SourceKind;
  matchedTerms: string[];
  shortlisted: boolean;
  sourceName: string;
};

export type BusinessAreaDiscoverySummary = {
  accessibleCandidateCount: number;
  areaDescription: string;
  areaKey: BusinessAreaKey;
  areaLabel: string;
  candidateCount: number;
  candidates: DiscoverySourceSummary[];
  existingCandidateCount: number;
  matchedSourceCount: number;
  matchedSources: DiscoverySearchMatch[];
  recommendedSource: string | null;
  searchTerms: string[];
};

export type Phase0DiscoverySummary = {
  accessibleCandidateSourceCount: number;
  accessListError: string | null;
  accessListCount: number;
  businessAreas: BusinessAreaDiscoverySummary[];
  candidateSourceCount: number;
  documentationUrl: string;
  existingCandidateSourceCount: number;
  generatedAt: string;
  includeSchemas: boolean;
  matchedBusinessSourceCount: number;
  mockMode: boolean;
  tableListCount: number;
  targetUserId: string;
};

export async function getPhase0DiscoverySummary(
  options: { includeSchemas?: boolean; userId?: string } = {},
): Promise<Phase0DiscoverySummary> {
  const includeSchemas = options.includeSchemas ?? true;
  const userId = options.userId ?? process.env.Q360_API_USER ?? "";

  const [accessListResult, tableList] = await Promise.all([
    getDatasourceAccessList(userId)
      .then((accessList) => ({
        accessList,
        error: null as string | null,
      }))
      .catch((error: unknown) => ({
        accessList: [] as Q360DatasourceAccessItem[],
        error:
          error instanceof Error
            ? error.message
            : "Datasource access list request failed.",
      })),
    getTableList(),
  ]);

  const accessList = accessListResult.accessList;
  const accessMap = new Map(
    accessList.map((source) => [normalizeSourceName(source.datasource), source]),
  );
  const tableMap = new Map(
    tableList.map((source) => [normalizeSourceName(source.table_dbf), source]),
  );
  const sourceAreaCountMap = getSourceAreaCountMap();
  const schemaSummaries = await buildSchemaSummaries(includeSchemas, tableMap);
  const allMatchedSourceNames = new Set<string>();

  const businessAreas: BusinessAreaDiscoverySummary[] = Object.entries(
    businessAreaDefinitions,
  ).map(([areaKey, definition]) => {
    const candidates: DiscoverySourceSummary[] = definition.candidateSources.map(
      (sourceName) => {
        const normalizedSourceName = normalizeSourceName(sourceName);
        const accessItem = accessMap.get(normalizedSourceName);
        const tableItem = tableMap.get(normalizedSourceName);
        const schemaSummary = schemaSummaries.get(normalizedSourceName);

        return {
          accessible: Boolean(accessItem && accessItem.accessflag === "Y"),
          areaCount: sourceAreaCountMap.get(normalizedSourceName) ?? 1,
          exists: Boolean(tableItem),
          fieldCount: schemaSummary?.fieldCount ?? null,
          kind: tableItem?.table_type ?? accessItem?.sourcetype ?? "UNKNOWN",
          primaryKey: schemaSummary?.primaryKey ?? accessItem?.pkname ?? null,
          sampleFields: schemaSummary?.sampleFields ?? [],
          schemaError: schemaSummary?.schemaError ?? null,
          sourceName,
        };
      },
    );

    const candidateNames = new Set(
      definition.candidateSources.map((sourceName) => normalizeSourceName(sourceName)),
    );

    const matchedSources = tableList
      .map((source) => {
        const matchedTerms = getMatchedTerms(source.table_dbf, definition.searchTerms);
        if (matchedTerms.length === 0) {
          return null;
        }

        allMatchedSourceNames.add(source.table_dbf);
        return {
          kind: source.table_type,
          matchedTerms,
          shortlisted: candidateNames.has(source.table_dbf),
          sourceName: source.table_dbf,
        } satisfies DiscoverySearchMatch;
      })
      .filter((match): match is DiscoverySearchMatch => match !== null)
      .sort(compareMatchedSources);

    return {
      accessibleCandidateCount: candidates.filter((candidate) => candidate.accessible)
        .length,
      areaDescription: definition.description,
      areaKey: areaKey as BusinessAreaKey,
      areaLabel: businessAreaLabels[areaKey as BusinessAreaKey],
      candidateCount: candidates.length,
      candidates,
      existingCandidateCount: candidates.filter((candidate) => candidate.exists).length,
      matchedSourceCount: matchedSources.length,
      matchedSources: matchedSources.slice(0, MATCH_SAMPLE_LIMIT),
      recommendedSource: buildRecommendedSource(candidates, matchedSources),
      searchTerms: [...definition.searchTerms],
    };
  });

  return {
    accessibleCandidateSourceCount: Array.from(
      new Set(
        businessAreas
          .flatMap((area) => area.candidates)
          .filter((candidate) => candidate.accessible)
          .map((candidate) => candidate.sourceName),
      ),
    ).length,
    accessListCount: accessList.length,
    accessListError: accessListResult.error,
    businessAreas,
    candidateSourceCount: allCandidateSources.length,
    documentationUrl: getQ360DocumentationUrl(),
    existingCandidateSourceCount: Array.from(
      new Set(
        businessAreas
          .flatMap((area) => area.candidates)
          .filter((candidate) => candidate.exists)
          .map((candidate) => candidate.sourceName),
      ),
    ).length,
    generatedAt: new Date().toISOString(),
    includeSchemas,
    matchedBusinessSourceCount: allMatchedSourceNames.size,
    mockMode: isMockMode(),
    tableListCount: tableList.length,
    targetUserId: userId || process.env.Q360_API_USER || "MOCK_Q360_API",
  };
}
