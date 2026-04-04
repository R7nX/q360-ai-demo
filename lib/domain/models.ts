export type SourceRecordId = string;
export type SourceRecordKind = "activity" | "billing" | "project" | "task";
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
  lastActivityAt: string | null;
  sourceName: string;
};

export type Quote = {
  id: string;
  title: string | null;
  status: string | null;
  customerId: string | null;
  ownerId: string | null;
  amount: number | null;
  updatedAt: string | null;
  sourceName: string;
};

export type Project = {
  id: string;
  title: string | null;
  ownerId: string | null;
  status: string | null;
  dueDate: string | null;
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
  ownerId: string | null;
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
  description: string | null;
  billedAt: string | null;
  hoursBilled: number | null;
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
