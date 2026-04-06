/**
 * TypeScript contracts for Feature 2 (Automated Utility Suite): automation kinds, API payloads,
 * overdue scanner models, and shared AI widget types (`AiEntityType`, tool responses).
 */

export type AutomationType =
  | "project-status"
  | "service-closure"
  | "overdue-alert"
  | "new-call-ack";

export type ToneOption = "professional" | "friendly" | "concise";

export interface GenerateRequest {
  recordType: "dispatch";
  recordId: string;
  automationType: AutomationType;
  tone: ToneOption;
}

export interface RecordSummary {
  id: string;
  customerName: string;
  siteName: string;
  status: string;
  problem: string;
  date: string;
  techAssigned: string;
}

export interface AutomationConfig {
  id: AutomationType;
  title: string;
  description: string;
  icon: string;
}


// ── Overdue Dispatch Alert (Automation 3) ──

export type UrgencyTier = "CRITICAL" | "HIGH" | "MEDIUM";

export interface OverdueAlert {
  dispatchno: string;
  urgencyTier: UrgencyTier;
  daysOverdue: number;
  customer: string;
  site: string;
  problem: string;
  techAssigned: string | null;
  priority: string | null;
  aiSummary: string;
  recommendedAction: string;
}

export interface OverdueSummary {
  totalScanned: number;
  totalOverdue: number;
  critical: number;
  high: number;
  medium: number;
}

export interface OverdueAnalysisResult {
  summary: OverdueSummary;
  alerts: OverdueAlert[];
}

export interface OverdueApiResponse {
  success: boolean;
  data: OverdueAnalysisResult | null;
  state: "empty" | "all_clear" | "alerts" | "error";
  message?: string;
}

// ── Shared AI Tool Types (Layer B) ──

export type AiEntityType = "dispatch";

export type AiToneOption = ToneOption | "formal" | "urgent";

export type AiAudience =
  | "manager"
  | "customer"
  | "technician"
  | "internal";

export interface AiToolRequest {
  entityType: AiEntityType;
  entityId: string;
  intent?: string;
  context?: Record<string, unknown>;
  audience?: AiAudience;
  tone?: AiToneOption;
}

export interface AiToolResult {
  content: string;
  subject?: string;
  actions?: { action: string; priority: string; assignTo: string; reasoning: string }[];
  keyFacts?: string[];
  currentStatus?: string;
  notableIssues?: string[];
  metadata: {
    model: string;
    entityType: string;
    entityId: string;
  };
}

export interface AiToolResponse {
  success: boolean;
  result: AiToolResult | null;
  message?: string;
}
