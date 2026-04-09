export const businessAreaDefinitions = {
  projectDelivery: {
    candidateSources: [
      "LDView_Project",
      "LDView_ProjectSnapshot",
      "LDView_ProjectDetail",
      "PROJECTS",
      "PROJECTSCHEDULE",
      "PROJECTEVENTS",
    ],
    description:
      "Project status, milestones, execution state, and progress context.",
    label: "Project delivery",
    searchTerms: ["PROJECT", "MILESTONE", "EVENT", "STATUS"],
  },
  followUpsAgenda: {
    candidateSources: [
      "LDView_Task",
      "TaskConsoleView",
      "TASKS",
      "PROJECTTASKHISTORY",
      "GLOBALSCHEDULE",
    ],
    description:
      "Tasks, updates, and schedule items that move deals and projects forward.",
    label: "Follow-ups and agenda",
    searchTerms: ["TASK", "SCHEDULE", "EVENT", "ACTIVITY"],
  },
  billingEffort: {
    candidateSources: [
      "TIMEBILL",
      "LDView_TimeBillSummary",
      "LDView_ProjectHours",
      "PROJECTITEM",
    ],
    description:
      "Hours, effort, and early billing pressure that affect delivery and revenue.",
    label: "Billing and effort",
    searchTerms: ["TIMEBILL", "BILL", "LABOR", "HOUR", "WIP"],
  },
  profitabilityForecast: {
    candidateSources: ["LDView_ProjectProfit", "PROJECTFORECAST", "PROJECTITEM"],
    description:
      "Margin, forecast, and financial drift signals that should surface early.",
    label: "Profitability and forecast",
    searchTerms: ["PROFIT", "FORECAST", "MARGIN", "COST"],
  },
  commercialPipeline: {
    candidateSources: ["CUSTOMER"],
    description:
      "Commercial pipeline coverage for customers, deals, quotes, and invoices.",
    label: "Customers, deals, quotes, and invoices",
    searchTerms: [
      "CUSTOMER",
      "DEAL",
      "OPPORTUNITY",
      "QUOTE",
      "PROPOSAL",
      "ESTIMATE",
      "SALES",
      "INVOICE",
      "BILL",
    ],
  },
} as const;

export type BusinessAreaKey = keyof typeof businessAreaDefinitions;

export const businessAreaLabels: Record<BusinessAreaKey, string> = Object.fromEntries(
  Object.entries(businessAreaDefinitions).map(([areaKey, definition]) => [
    areaKey,
    definition.label,
  ]),
) as Record<BusinessAreaKey, string>;

export const schemaSpotlightSources = [
  "PROJECTS",
  "LDView_Task",
  "TIMEBILL",
  "LDView_ProjectHours",
] as const;

export const allCandidateSources = Array.from(
  new Set(
    Object.values(businessAreaDefinitions).flatMap(
      (definition) => definition.candidateSources,
    ),
  ),
);

export const allBusinessSearchTerms = Array.from(
  new Set(
    Object.values(businessAreaDefinitions).flatMap(
      (definition) => definition.searchTerms,
    ),
  ),
);
