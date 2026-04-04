import type {
  Activity,
  BillingSnapshot,
  Customer,
  Deal,
  Dispatch,
  Invoice,
  ProfitabilitySnapshot,
  Project,
  Quote,
  ScheduleItem,
  ServiceContract,
  Task,
  User,
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
    | "hoursBudget"
    | "id"
    | "lastActivityAt"
    | "ownerId"
    | "percentComplete"
    | "revenueBudget"
    | "salesRepId"
    | "siteId"
    | "startDate"
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
    hoursBudget: toNumberOrNull(getRowValue(row, fieldMap.hoursBudget)),
    id,
    lastActivityAt: toStringOrNull(getRowValue(row, fieldMap.lastActivityAt)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    percentComplete: toNumberOrNull(getRowValue(row, fieldMap.percentComplete)),
    revenueBudget: toNumberOrNull(getRowValue(row, fieldMap.revenueBudget)),
    salesRepId: toStringOrNull(getRowValue(row, fieldMap.salesRepId)),
    siteId: toStringOrNull(getRowValue(row, fieldMap.siteId)),
    sourceName,
    startDate: toStringOrNull(getRowValue(row, fieldMap.startDate)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
  };
}

export function normalizeTaskRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    | "dueDate"
    | "id"
    | "notes"
    | "ownerId"
    | "projectId"
    | "projectTitle"
    | "sequence"
    | "status"
    | "title"
    | "updatedAt"
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
    projectTitle: toStringOrNull(getRowValue(row, fieldMap.projectTitle)),
    sequence: toStringOrNull(getRowValue(row, fieldMap.sequence)),
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
    | "amount"
    | "billedAt"
    | "category"
    | "customerId"
    | "description"
    | "dispatchId"
    | "hoursBilled"
    | "id"
    | "projectId"
    | "rate"
    | "userId"
  >,
  sourceName: string,
): BillingSnapshot | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    amount: toNumberOrNull(getRowValue(row, fieldMap.amount)),
    billedAt: toStringOrNull(getRowValue(row, fieldMap.billedAt)),
    category: toStringOrNull(getRowValue(row, fieldMap.category)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    description: truncateText(
      toStringOrNull(getRowValue(row, fieldMap.description)),
      120,
    ),
    dispatchId: toStringOrNull(getRowValue(row, fieldMap.dispatchId)),
    hoursBilled: toNumberOrNull(getRowValue(row, fieldMap.hoursBilled)),
    id,
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    rate: toNumberOrNull(getRowValue(row, fieldMap.rate)),
    sourceName,
    userId: toStringOrNull(getRowValue(row, fieldMap.userId)),
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
  fieldMap: FieldMap<
    | "amount"
    | "customerId"
    | "customerName"
    | "forecastAmount"
    | "id"
    | "lastActivityAt"
    | "ownerId"
    | "probabilityPercent"
    | "stage"
    | "status"
    | "title"
    | "updatedAt"
  >,
  sourceName: string,
): Deal | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    amount: toNumberOrNull(getRowValue(row, fieldMap.amount)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    customerName: toStringOrNull(getRowValue(row, fieldMap.customerName)),
    forecastAmount: toNumberOrNull(getRowValue(row, fieldMap.forecastAmount)),
    id,
    lastActivityAt: toStringOrNull(getRowValue(row, fieldMap.lastActivityAt)),
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    probabilityPercent: toNumberOrNull(getRowValue(row, fieldMap.probabilityPercent)),
    sourceName,
    stage: toStringOrNull(getRowValue(row, fieldMap.stage)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
    updatedAt: toStringOrNull(getRowValue(row, fieldMap.updatedAt)),
  };
}

export function normalizeQuoteRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    | "amount"
    | "customerId"
    | "customerName"
    | "id"
    | "ownerId"
    | "stage"
    | "status"
    | "title"
    | "updatedAt"
    | "validUntil"
  >,
  sourceName: string,
): Quote | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    amount: toNumberOrNull(getRowValue(row, fieldMap.amount)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    customerName: toStringOrNull(getRowValue(row, fieldMap.customerName)),
    id,
    ownerId: toStringOrNull(getRowValue(row, fieldMap.ownerId)),
    sourceName,
    stage: toStringOrNull(getRowValue(row, fieldMap.stage)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
    updatedAt: toStringOrNull(getRowValue(row, fieldMap.updatedAt)),
    validUntil: toStringOrNull(getRowValue(row, fieldMap.validUntil)),
  };
}

export function normalizeCustomerRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    | "address1"
    | "balance"
    | "city"
    | "company"
    | "id"
    | "phone"
    | "salesRepId"
    | "state"
    | "status"
    | "ytdSales"
    | "zip"
  >,
  sourceName: string,
): Customer | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    address1: toStringOrNull(getRowValue(row, fieldMap.address1)),
    balance: toNumberOrNull(getRowValue(row, fieldMap.balance)),
    city: toStringOrNull(getRowValue(row, fieldMap.city)),
    company: toStringOrNull(getRowValue(row, fieldMap.company)),
    id,
    phone: toStringOrNull(getRowValue(row, fieldMap.phone)),
    salesRepId: toStringOrNull(getRowValue(row, fieldMap.salesRepId)),
    sourceName,
    state: toStringOrNull(getRowValue(row, fieldMap.state)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    ytdSales: toNumberOrNull(getRowValue(row, fieldMap.ytdSales)),
    zip: toStringOrNull(getRowValue(row, fieldMap.zip)),
  };
}

export function normalizeDispatchRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    | "branch"
    | "callType"
    | "caller"
    | "callerEmail"
    | "closedAt"
    | "csrId"
    | "customerId"
    | "id"
    | "machineId"
    | "openedAt"
    | "primaryTechnicianId"
    | "priority"
    | "problem"
    | "problemCode"
    | "projectId"
    | "secondaryTechnicianId"
    | "serviceContractId"
    | "siteId"
    | "solution"
    | "startedAt"
    | "status"
  >,
  sourceName: string,
): Dispatch | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    branch: toStringOrNull(getRowValue(row, fieldMap.branch)),
    callType: toStringOrNull(getRowValue(row, fieldMap.callType)),
    caller: toStringOrNull(getRowValue(row, fieldMap.caller)),
    callerEmail: toStringOrNull(getRowValue(row, fieldMap.callerEmail)),
    closedAt: toStringOrNull(getRowValue(row, fieldMap.closedAt)),
    csrId: toStringOrNull(getRowValue(row, fieldMap.csrId)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    id,
    machineId: toStringOrNull(getRowValue(row, fieldMap.machineId)),
    openedAt: toStringOrNull(getRowValue(row, fieldMap.openedAt)),
    primaryTechnicianId: toStringOrNull(getRowValue(row, fieldMap.primaryTechnicianId)),
    priority: toNumberOrNull(getRowValue(row, fieldMap.priority)),
    problem: truncateText(toStringOrNull(getRowValue(row, fieldMap.problem)), 180),
    problemCode: toStringOrNull(getRowValue(row, fieldMap.problemCode)),
    projectId: toStringOrNull(getRowValue(row, fieldMap.projectId)),
    secondaryTechnicianId: toStringOrNull(getRowValue(row, fieldMap.secondaryTechnicianId)),
    serviceContractId: toStringOrNull(getRowValue(row, fieldMap.serviceContractId)),
    siteId: toStringOrNull(getRowValue(row, fieldMap.siteId)),
    solution: truncateText(toStringOrNull(getRowValue(row, fieldMap.solution)), 180),
    sourceName,
    startedAt: toStringOrNull(getRowValue(row, fieldMap.startedAt)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
  };
}

export function normalizeInvoiceRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "amount" | "balance" | "customerId" | "dueDate" | "id" | "invoiceType" | "invoicedAt" | "status"
  >,
  sourceName: string,
): Invoice | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    amount: toNumberOrNull(getRowValue(row, fieldMap.amount)),
    balance: toNumberOrNull(getRowValue(row, fieldMap.balance)),
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    dueDate: toStringOrNull(getRowValue(row, fieldMap.dueDate)),
    id,
    invoiceType: toStringOrNull(getRowValue(row, fieldMap.invoiceType)),
    invoicedAt: toStringOrNull(getRowValue(row, fieldMap.invoicedAt)),
    sourceName,
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
  };
}

export function normalizeServiceContractRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "customerId" | "endDate" | "id" | "monthlyTotal" | "renewalDate" | "startDate" | "status" | "title" | "total"
  >,
  sourceName: string,
): ServiceContract | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    customerId: toStringOrNull(getRowValue(row, fieldMap.customerId)),
    endDate: toStringOrNull(getRowValue(row, fieldMap.endDate)),
    id,
    monthlyTotal: toNumberOrNull(getRowValue(row, fieldMap.monthlyTotal)),
    renewalDate: toStringOrNull(getRowValue(row, fieldMap.renewalDate)),
    sourceName,
    startDate: toStringOrNull(getRowValue(row, fieldMap.startDate)),
    status: toStringOrNull(getRowValue(row, fieldMap.status)),
    title: toStringOrNull(getRowValue(row, fieldMap.title)),
    total: toNumberOrNull(getRowValue(row, fieldMap.total)),
  };
}

export function normalizeUserRecord(
  row: Q360RecordRow,
  fieldMap: FieldMap<
    "activeFlag" | "branch" | "department" | "email" | "fullName" | "id" | "type"
  >,
  sourceName: string,
): User | null {
  const id = toStringOrNull(getRowValue(row, fieldMap.id));
  if (!id) {
    return null;
  }

  return {
    activeFlag: toStringOrNull(getRowValue(row, fieldMap.activeFlag)),
    branch: toStringOrNull(getRowValue(row, fieldMap.branch)),
    department: toStringOrNull(getRowValue(row, fieldMap.department)),
    email: toStringOrNull(getRowValue(row, fieldMap.email)),
    fullName: toStringOrNull(getRowValue(row, fieldMap.fullName)),
    id,
    sourceName,
    type: toStringOrNull(getRowValue(row, fieldMap.type)),
  };
}
