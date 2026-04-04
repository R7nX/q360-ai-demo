import type {
  Activity,
  BillingSnapshot,
  Deal,
  ProfitabilitySnapshot,
  Project,
  Quote,
  ScheduleItem,
  Task,
} from "@/lib/domain/models";

export type Q360RecordRow = Record<string, unknown>;

export type FieldMap<TField extends string> = Partial<Record<TField, string>>;

function getRowValue(
  row: Q360RecordRow,
  fieldName: string | undefined,
): unknown | null {
  if (!fieldName) {
    return null;
  }

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

function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  return Number.isFinite(numericValue) ? numericValue : null;
}

function truncateText(value: string | null, maxLength: number): string | null {
  if (!value) {
    return null;
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function resolveAvailableFields<TField extends string>(
  availableFields: readonly string[],
  fieldCandidates: Record<TField, readonly string[]>,
): FieldMap<TField> {
  const normalizedFields = new Map(
    availableFields.map((fieldName) => [fieldName.toUpperCase(), fieldName]),
  );

  const resolvedFields = {} as FieldMap<TField>;

  for (const [fieldKey, aliases] of Object.entries(fieldCandidates) as Array<
    [TField, readonly string[]]
  >) {
    const match = aliases.find((alias) => normalizedFields.has(alias.toUpperCase()));
    if (match) {
      resolvedFields[fieldKey] = normalizedFields.get(match.toUpperCase());
    }
  }

  return resolvedFields;
}

export function normalizeProjectRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    | "customerId"
    | "customerName"
    | "dueDate"
    | "id"
    | "lastActivityAt"
    | "ownerId"
    | "status"
    | "title"
  >,
  sourceName: string,
): Project | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    customerName: toStringOrNull(getRowValue(row, fieldMap.customerName)),
    dueDate: toStringOrNull(getRowValue(row, fieldMap.dueDate)),
    id,
    lastActivityAt: toStringOrNull(getRowValue(row, fieldMap.lastActivityAt)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    sourceName,
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
  };
}

export function normalizeTaskRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "dueDate" | "id" | "notes" | "ownerId" | "projectId" | "status" | "title" | "updatedAt"
  >,
  sourceName: string,
): Task | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    dueDate: toStringOrNull(getRowValue(row, fieldMap.dueDate)),
    id,
    notesExcerpt: truncateText(
      toStringOrNull(getRowValue(row, fieldMap.notes)),
      120,
    ),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    sourceName,
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
    updatedAt: toStringOrNull(getRowValue(row, fieldMap.updatedAt)),
  };
}

export function normalizeScheduleItemRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "endAt" | "id" | "linkNo" | "linkType" | "ownerId" | "projectId" | "startAt" | "status" | "title"
  >,
  sourceName: string,
): ScheduleItem | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    endAt: toStringOrNull(getRowValue(row, fieldMap.endAt)),
    id,
    linkNo: toStringOrNull(getRowValue(row, fieldMap.linkNo)),
    linkType: toStringOrNull(getRowValue(row, fieldMap.linkType)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    sourceName,
    startAt: toStringOrNull(getRowValue(row, fieldMap.startAt)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
  };
}

export function normalizeActivityRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<"id" | "occurredAt" | "ownerId" | "projectId" | "summary" | "type">,
  sourceName: string,
): Activity | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    id,
    occurredAt: toStringOrNull(getRowValue(row, fieldMap.occurredAt)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    sourceName,
    summary: truncateText(
      toStringOrNull(getRowValue(row, fieldMap.summary)),
      180,
    ),
    type: toStringOrNull(getRowValue(row, fieldMap.type)),
  };
}

export function normalizeBillingSnapshotRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "billedAt" | "category" | "customerId" | "description" | "hoursBilled" | "id" | "projectId"
  >,
  sourceName: string,
): BillingSnapshot | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    billedAt: toStringOrNull(getRowValue(row, fieldMap.billedAt)),
    category: toStringOrNull(getRowValue(row, fieldMap.category)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    description: truncateText(
      toStringOrNull(getRowValue(row, fieldMap.description)),
      120,
    ),
    hoursBilled: toNumberOrNull(getRowValue(row, fieldMap.hoursBilled)),
    id,
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    sourceName,
  };
}

export function normalizeProfitabilitySnapshotRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "cost" | "grossMargin" | "grossProfit" | "id" | "projectId" | "revenue" | "updatedAt"
  >,
  sourceName: string,
): ProfitabilitySnapshot | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    cost: toNumberOrNull(getRowValue(row, fieldMap.cost)),
    grossMargin: toNumberOrNull(getRowValue(row, fieldMap.grossMargin)),
    grossProfit: toNumberOrNull(getRowValue(row, fieldMap.grossProfit)),
    id,
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    revenue: toNumberOrNull(getRowValue(row, fieldMap.revenue)),
    sourceName,
    updatedAt: toStringOrNull(getRowValue(row, fieldMap.updatedAt)),
  };
}

export function normalizeDealRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<"customerId" | "id" | "lastActivityAt" | "ownerId" | "status" | "title">,
  sourceName: string,
): Deal | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    id,
    lastActivityAt: toStringOrNull(getRowValue(row, fieldMap.lastActivityAt)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    sourceName,
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
  };
}

export function normalizeQuoteRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<"amount" | "customerId" | "id" | "ownerId" | "status" | "title" | "updatedAt">,
  sourceName: string,
): Quote | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    amount: toNumberOrNull(getRowValue(row, fieldMap.amount)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    id,
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    sourceName,
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
    updatedAt: toStringOrNull(getRowValue(row, fieldMap.updatedAt)),
  };
}
