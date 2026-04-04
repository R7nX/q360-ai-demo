// Team 1 business models are kept as a superset of the current live-safe
// project/task slice and the broader manager schema in the master plan. That
// lets the ported Feature 1 code stay stable while future PostgreSQL-backed
// pages can grow into the same contract.

export type SourceRecordId = string;
export type SourceRecordKind =
  | "activity"
  | "billing"
  | "customer"
  | "deal"
  | "dispatch"
  | "invoice"
  | "project"
  | "quote"
  | "serviceContract"
  | "task"
  | "user";
export type RecommendationPriority = "low" | "medium" | "high";

export type SourceRecordRef = {
  id: string;
  kind: SourceRecordKind;
  label: string | null;
  sourceName: string;
};

export type Deal = {
  id: string;
  title: string | null;
  ownerId: string | null;
  status: string | null;
  customerId: string | null;
  customerName: string | null;
  amount: number | null;
  forecastAmount: number | null;
  probabilityPercent: number | null;
  stage: string | null;
  lastActivityAt: string | null;
  updatedAt: string | null;
  sourceName: string;
};

export type Quote = {
  id: string;
  title: string | null;
  status: string | null;
  customerId: string | null;
  customerName: string | null;
  ownerId: string | null;
  amount: number | null;
  validUntil: string | null;
  stage: string | null;
  updatedAt: string | null;
  sourceName: string;
};

export type Project = {
  id: string;
  title: string | null;
  ownerId: string | null;
  salesRepId: string | null;
  status: string | null;
  dueDate: string | null;
  startDate: string | null;
  percentComplete: number | null;
  hoursBudget: number | null;
  revenueBudget: number | null;
  siteId: string | null;
  customerId: string | null;
  customerName: string | null;
  lastActivityAt: string | null;
  sourceName: string;
};

export type Task = {
  id: string;
  title: string | null;
  status: string | null;
  dueDate: string | null;
  projectId: string | null;
  projectTitle: string | null;
  ownerId: string | null;
  sequence: string | null;
  notesExcerpt: string | null;
  updatedAt: string | null;
  sourceName: string;
};

export type ScheduleItem = {
  id: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  ownerId: string | null;
  projectId: string | null;
  status: string | null;
  linkType: string | null;
  linkNo: string | null;
  sourceName: string;
};

export type Activity = {
  id: string;
  projectId: string | null;
  type: string | null;
  summary: string | null;
  occurredAt: string | null;
  ownerId: string | null;
  sourceName: string;
};

export type BillingSnapshot = {
  id: string;
  projectId: string | null;
  customerId: string | null;
  dispatchId: string | null;
  userId: string | null;
  description: string | null;
  billedAt: string | null;
  hoursBilled: number | null;
  rate: number | null;
  amount: number | null;
  category: string | null;
  sourceName: string;
};

export type ProfitabilitySnapshot = {
  id: string;
  projectId: string | null;
  revenue: number | null;
  cost: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
  updatedAt: string | null;
  sourceName: string;
};

export type Customer = {
  id: string;
  company: string | null;
  phone: string | null;
  address1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  salesRepId: string | null;
  status: string | null;
  balance: number | null;
  ytdSales: number | null;
  sourceName: string;
};

export type Dispatch = {
  id: string;
  customerId: string | null;
  siteId: string | null;
  machineId: string | null;
  serviceContractId: string | null;
  projectId: string | null;
  primaryTechnicianId: string | null;
  secondaryTechnicianId: string | null;
  status: string | null;
  callType: string | null;
  problemCode: string | null;
  problem: string | null;
  solution: string | null;
  openedAt: string | null;
  startedAt: string | null;
  closedAt: string | null;
  priority: number | null;
  branch: string | null;
  caller: string | null;
  callerEmail: string | null;
  csrId: string | null;
  sourceName: string;
};

export type ServiceContract = {
  id: string;
  title: string | null;
  customerId: string | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  status: string | null;
  monthlyTotal: number | null;
  total: number | null;
  sourceName: string;
};

export type Invoice = {
  id: string;
  customerId: string | null;
  invoicedAt: string | null;
  dueDate: string | null;
  amount: number | null;
  balance: number | null;
  invoiceType: string | null;
  status: string | null;
  sourceName: string;
};

export type User = {
  id: string;
  fullName: string | null;
  email: string | null;
  type: string | null;
  branch: string | null;
  department: string | null;
  activeFlag: string | null;
  sourceName: string;
};

export type HealthSignal = {
  id: string;
  ruleKey: string;
  severity: RecommendationPriority;
  sourceRecordIds: SourceRecordId[];
  summary: string;
};

export type Recommendation = {
  code: string;
  dueDate: string | null;
  id: string;
  ownerId: string | null;
  priority: RecommendationPriority;
  projectId: string | null;
  projectTitle: string | null;
  rationale: string;
  sourceRecordIds: SourceRecordId[];
  sourceRecords: SourceRecordRef[];
  summary: string;
  title: string;
};

export type AgendaItem = {
  dueDate: string | null;
  id: string;
  kind: "recommendation" | "task";
  ownerId: string | null;
  priority: RecommendationPriority;
  projectId: string | null;
  projectTitle: string | null;
  rank: number;
  sourceRecordIds: SourceRecordId[];
  sourceRecords: SourceRecordRef[];
  summary: string;
  title: string;
};
