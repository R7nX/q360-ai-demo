// Types for Feature 2: Automated Utility Suite

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
