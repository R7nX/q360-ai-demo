/**
 * Shared constants — route paths, API endpoints, status codes.
 *
 * Import these instead of hardcoding strings. Keeps all teams in sync
 * and makes refactoring routes painless.
 */

// ──── Page Routes ──────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",

  // Manager (Team 1)
  MANAGER_DASHBOARD: "/dashboard",
  MANAGER_PROJECTS: "/projects",
  MANAGER_SERVICE: "/service",
  MANAGER_SALES: "/sales",
  MANAGER_ACCOUNTING: "/accounting",
  MANAGER_REPORTS: "/reports",

  // Employee (Team 3)
  EMPLOYEE_HOME: "/home",
  EMPLOYEE_DISPATCHES: "/my-dispatches",
  EMPLOYEE_TASKS: "/my-tasks",
  EMPLOYEE_TIME: "/time",
  EMPLOYEE_SCHEDULE: "/schedule",
  EMPLOYEE_WORKFLOWS: "/workflows",
} as const;

// ──── Internal API Endpoints ───────────────────────────────────────────────

export const API = {
  // Q360 proxy routes
  Q360_DISPATCHES: "/api/q360/dispatches",
  Q360_PROJECTS: "/api/q360/projects",
  Q360_CUSTOMERS: "/api/q360/customers",
  Q360_CONTACTS: "/api/q360/contacts",
  Q360_TIMEBILLS: "/api/q360/timebills",
  Q360_SERVICE_CONTRACTS: "/api/q360/service-contracts",
  Q360_SITES: "/api/q360/sites",
  Q360_USERS: "/api/q360/users",
  Q360_INVOICES: "/api/q360/invoices",

  // AI tool routes (Team 2)
  AI_DRAFT_EMAIL: "/api/ai/draft-email",
  AI_STATUS_REPORT: "/api/ai/status-report",
  AI_SMART_REPLY: "/api/ai/smart-reply",
  AI_SUMMARIZE: "/api/ai/summarize",
  AI_RECOMMEND: "/api/ai/recommend",

  // n8n webhook
  N8N_WEBHOOK: "/api/n8n/webhook",
} as const;

// ──── Q360 Status Codes ────────────────────────────────────────────────────

export const DISPATCH_STATUSES = [
  "OPEN",
  "IN PROGRESS",
  "SCHEDULED",
  "CLOSED",
  "CANCELLED",
] as const;

export const PROJECT_STATUSES = [
  "ACTIVE",
  "ON HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export const CONTRACT_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "PENDING",
] as const;
