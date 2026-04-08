import { parseQ360Date } from "@/lib/domain/dates";
import type {
  AgendaItem,
  Recommendation,
  RecommendationPriority,
  SourceRecordId,
  SourceRecordKind,
  SourceRecordRef,
} from "@/lib/domain/models";

export type RuleCode =
  | "billing_gap"
  | "overdue_task"
  | "stalled_project";

export type RulesProjectInput = {
  atRisk: boolean;
  dueDate: string | null;
  id: string;
  lastActivityAt: string | null;
  nextTaskDueDate: string | null;
  openTaskCount: number;
  overdueTaskCount: number;
  ownerId: string | null;
  sourceName: string;
  status: string | null;
  taskCount: number;
  title: string | null;
};

export type RulesTaskInput = {
  dueDate: string | null;
  id: string;
  isDueToday: boolean;
  isOverdue: boolean;
  notesExcerpt: string | null;
  ownerId: string | null;
  projectId: string | null;
  projectTitle: string | null;
  sourceName: string;
  status: string | null;
  title: string | null;
  updatedAt: string | null;
};

export type RulesActivityInput = {
  id: string;
  occurredAt: string | null;
  ownerId: string | null;
  projectId: string | null;
  projectTitle: string | null;
  sourceName: string;
  summary: string | null;
  type: string | null;
};

export type RulesBillingInput = {
  billedAt: string | null;
  category: string | null;
  description: string | null;
  hoursBilled: number | null;
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  sourceName: string;
};

export type ActionCenterResponse = {
  agenda: AgendaItem[];
  recommendations: Recommendation[];
  summary: {
    agendaCount: number;
    highPriorityCount: number;
    lowPriorityCount: number;
    mediumPriorityCount: number;
    recommendationCount: number;
    triggeredRuleCount: number;
    triggeredRuleCounts: Record<RuleCode, number>;
  };
};

type ActionCenterOptions = {
  agendaLimit?: number;
  recommendationLimit?: number;
};

const DAYS_PER_MS = 24 * 60 * 60 * 1000;
const MAX_AGENDA_LIMIT = 12;
const MAX_RECOMMENDATION_LIMIT = 8;
const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const CLOSED_STATUSES = new Set([
  "CANCELLED",
  "CLOSED",
  "COMPLETE",
  "COMPLETED",
  "DONE",
]);

export const BUSINESS_RULE_THRESHOLDS = {
  agendaLimit: 8,
  billingGapDays: 14,
  recommendationLimit: 6,
  recentProjectUpdateDays: 7,
  stalledProjectDays: 10,
} as const;

function buildSourceRecordId(kind: SourceRecordKind, id: string): SourceRecordId {
  return `${kind}:${id}`;
}

function buildSourceRecord(
  kind: SourceRecordKind,
  id: string,
  sourceName: string,
  label: string | null,
): SourceRecordRef {
  return {
    id,
    kind,
    label,
    sourceName,
  };
}

function readDate(value: string | null): Date | null {
  return parseQ360Date(value);
}

function daysSince(value: string | null): number | null {
  const date = readDate(value);
  if (!date) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAYS_PER_MS));
}

function compareNullableDate(left: string | null, right: string | null): number {
  const leftTime = readDate(left)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightTime = readDate(right)?.getTime() ?? Number.POSITIVE_INFINITY;

  return leftTime - rightTime;
}

function comparePriority(
  left: RecommendationPriority,
  right: RecommendationPriority,
): number {
  return PRIORITY_ORDER[left] - PRIORITY_ORDER[right];
}

function sortRecommendations(
  left: Recommendation,
  right: Recommendation,
): number {
  const priorityComparison = comparePriority(left.priority, right.priority);
  if (priorityComparison !== 0) {
    return priorityComparison;
  }

  const dateComparison = compareNullableDate(left.dueDate, right.dueDate);
  if (dateComparison !== 0) {
    return dateComparison;
  }

  return left.title.localeCompare(right.title);
}

function sortAgendaItems(left: AgendaItem, right: AgendaItem): number {
  const priorityComparison = comparePriority(left.priority, right.priority);
  if (priorityComparison !== 0) {
    return priorityComparison;
  }

  const dateComparison = compareNullableDate(left.dueDate, right.dueDate);
  if (dateComparison !== 0) {
    return dateComparison;
  }

  return left.title.localeCompare(right.title);
}

function normalizeLimit(value: number | undefined, fallback: number, max: number): number {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(value), max);
}

function isClosedStatus(status: string | null): boolean {
  return status ? CLOSED_STATUSES.has(status.toUpperCase()) : false;
}

function buildOverdueTaskRecommendations(
  tasks: RulesTaskInput[],
): Recommendation[] {
  return tasks
    .filter((task) => task.isOverdue)
    .map((task) => {
      const sourceRecords = [
        buildSourceRecord("task", task.id, task.sourceName, task.title),
      ];

      if (task.projectId) {
        sourceRecords.push(
          buildSourceRecord(
            "project",
            task.projectId,
            "Project",
            task.projectTitle,
          ),
        );
      }

      return {
        code: "overdue_task",
        dueDate: task.dueDate,
        id: `overdue-task:${task.id}`,
        ownerId: task.ownerId,
        priority: "high",
        projectId: task.projectId,
        projectTitle: task.projectTitle,
        rationale: task.notesExcerpt
          ? `Task note: ${task.notesExcerpt}`
          : "The task is still open past its due date and needs an immediate owner check-in.",
        sourceRecordIds: sourceRecords.map((record) =>
          buildSourceRecordId(record.kind, record.id),
        ),
        sourceRecords,
        summary: `${task.title ?? "Untitled task"} is overdue and still open.`,
        title: `Resolve overdue task: ${task.title ?? task.id}`,
      } satisfies Recommendation;
    });
}

function buildStalledProjectRecommendations(
  projects: RulesProjectInput[],
): Recommendation[] {
  return projects
    .filter((project) => !isClosedStatus(project.status))
    .filter((project) => project.openTaskCount > 0 || project.atRisk)
    .flatMap((project) => {
      const staleDays = daysSince(project.lastActivityAt);
      const shouldFlag =
        staleDays === null
          ? project.atRisk && project.openTaskCount > 0
          : staleDays >= BUSINESS_RULE_THRESHOLDS.stalledProjectDays;

      if (!shouldFlag) {
        return [];
      }

      const sourceRecords = [
        buildSourceRecord("project", project.id, project.sourceName, project.title),
      ];

      return [
        {
          code: "stalled_project",
          dueDate: project.nextTaskDueDate ?? project.dueDate,
          id: `stalled-project:${project.id}`,
          ownerId: project.ownerId,
          priority:
            project.atRisk || project.overdueTaskCount > 0 ? "high" : "medium",
          projectId: project.id,
          projectTitle: project.title,
          rationale:
            staleDays === null
              ? `No recent project activity timestamp is available while ${project.openTaskCount} open task(s) remain.`
              : `No recorded project movement has been seen in ${staleDays} day(s) while ${project.openTaskCount} open task(s) remain.`,
          sourceRecordIds: sourceRecords.map((record) =>
            buildSourceRecordId(record.kind, record.id),
          ),
          sourceRecords,
          summary:
            staleDays === null
              ? `${project.title ?? project.id} needs a fresh owner update.`
              : `${project.title ?? project.id} has been quiet for ${staleDays} day(s).`,
          title: `Re-engage project: ${project.title ?? project.id}`,
        } satisfies Recommendation,
      ];
    });
}

function buildBillingGapRecommendations(
  projects: RulesProjectInput[],
  billingEntries: RulesBillingInput[] | null,
): Recommendation[] {
  if (!billingEntries || billingEntries.length === 0) {
    return [];
  }

  const latestBillingByProject = new Map<string, RulesBillingInput>();
  for (const entry of billingEntries) {
    if (!entry.projectId) {
      continue;
    }

    const current = latestBillingByProject.get(entry.projectId);
    if (
      !current ||
      compareNullableDate(current.billedAt, entry.billedAt) < 0
    ) {
      latestBillingByProject.set(entry.projectId, entry);
    }
  }

  return projects.flatMap((project) => {
    if (isClosedStatus(project.status)) {
      return [];
    }

    const recentProjectMovementDays = daysSince(project.lastActivityAt);
    if (
      recentProjectMovementDays === null ||
      recentProjectMovementDays > BUSINESS_RULE_THRESHOLDS.recentProjectUpdateDays ||
      project.openTaskCount === 0
    ) {
      return [];
    }

    const latestBilling = latestBillingByProject.get(project.id);
    const billingAgeDays = latestBilling ? daysSince(latestBilling.billedAt) : null;
    const shouldFlag =
      latestBilling === undefined ||
      (billingAgeDays !== null &&
        billingAgeDays >= BUSINESS_RULE_THRESHOLDS.billingGapDays);

    if (!shouldFlag) {
      return [];
    }

    const sourceRecords = [
      buildSourceRecord("project", project.id, project.sourceName, project.title),
    ];

    if (latestBilling) {
      sourceRecords.push(
        buildSourceRecord(
          "billing",
          latestBilling.id,
          latestBilling.sourceName,
          latestBilling.projectTitle ?? latestBilling.description,
        ),
      );
    }

    return [
      {
        code: "billing_gap",
        dueDate: project.nextTaskDueDate ?? project.dueDate,
        id: `billing-gap:${project.id}`,
        ownerId: project.ownerId,
        priority: project.atRisk ? "high" : "medium",
        projectId: project.id,
        projectTitle: project.title,
        rationale: latestBilling
          ? `Project activity is recent, but the latest billing-linked record is ${billingAgeDays ?? "unknown"} day(s) old.`
          : "Project activity is recent, but no billing-linked record is available for the project yet.",
        sourceRecordIds: sourceRecords.map((record) =>
          buildSourceRecordId(record.kind, record.id),
        ),
        sourceRecords,
        summary: latestBilling
          ? `${project.title ?? project.id} may need a billing review.`
          : `${project.title ?? project.id} has recent movement without a linked billing signal.`,
        title: `Review billing coverage: ${project.title ?? project.id}`,
      } satisfies Recommendation,
    ];
  });
}

function buildTaskAgendaItems(tasks: RulesTaskInput[]): AgendaItem[] {
  return tasks.map((task) => {
    const priority: RecommendationPriority = task.isOverdue
      ? "high"
      : task.isDueToday
        ? "medium"
        : "low";
    const sourceRecords = [
      buildSourceRecord("task", task.id, task.sourceName, task.title),
    ];

    if (task.projectId) {
      sourceRecords.push(
        buildSourceRecord("project", task.projectId, "Project", task.projectTitle),
      );
    }

    return {
      dueDate: task.dueDate,
      id: `agenda-task:${task.id}`,
      kind: "task",
      ownerId: task.ownerId,
      priority,
      projectId: task.projectId,
      projectTitle: task.projectTitle,
      rank: 0,
      sourceRecordIds: sourceRecords.map((record) =>
        buildSourceRecordId(record.kind, record.id),
      ),
      sourceRecords,
      summary: task.notesExcerpt ?? "Open task requiring follow-up.",
      title: task.title ?? task.id,
    } satisfies AgendaItem;
  });
}

function buildRecommendationAgendaItems(
  recommendations: Recommendation[],
): AgendaItem[] {
  return recommendations
    .filter((recommendation) => recommendation.code !== "overdue_task")
    .map((recommendation) => ({
      dueDate: recommendation.dueDate,
      id: `agenda-recommendation:${recommendation.id}`,
      kind: "recommendation",
      ownerId: recommendation.ownerId,
      priority: recommendation.priority,
      projectId: recommendation.projectId,
      projectTitle: recommendation.projectTitle,
      rank: 0,
      sourceRecordIds: recommendation.sourceRecordIds,
      sourceRecords: recommendation.sourceRecords,
      summary: recommendation.summary,
      title: recommendation.title,
    }));
}

export function buildActionCenter(
  input: {
    activityStream: { activities: RulesActivityInput[] } | null;
    billingSummary: { entries: RulesBillingInput[] } | null;
    followUps: { tasks: RulesTaskInput[] };
    projectProgress: { projects: RulesProjectInput[] };
  },
  options: ActionCenterOptions = {},
): ActionCenterResponse {
  const recommendationLimit = normalizeLimit(
    options.recommendationLimit,
    BUSINESS_RULE_THRESHOLDS.recommendationLimit,
    MAX_RECOMMENDATION_LIMIT,
  );
  const agendaLimit = normalizeLimit(
    options.agendaLimit,
    BUSINESS_RULE_THRESHOLDS.agendaLimit,
    MAX_AGENDA_LIMIT,
  );

  const ruleRecommendations = [
    ...buildOverdueTaskRecommendations(input.followUps.tasks),
    ...buildStalledProjectRecommendations(input.projectProgress.projects),
    ...buildBillingGapRecommendations(
      input.projectProgress.projects,
      input.billingSummary?.entries ?? null,
    ),
  ]
    .sort(sortRecommendations)
    .slice(0, recommendationLimit);

  const agenda = [
    ...buildTaskAgendaItems(input.followUps.tasks),
    ...buildRecommendationAgendaItems(ruleRecommendations),
  ]
    .sort(sortAgendaItems)
    .slice(0, agendaLimit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const triggeredRuleCounts: Record<RuleCode, number> = {
    billing_gap: ruleRecommendations.filter(
      (recommendation) => recommendation.code === "billing_gap",
    ).length,
    overdue_task: ruleRecommendations.filter(
      (recommendation) => recommendation.code === "overdue_task",
    ).length,
    stalled_project: ruleRecommendations.filter(
      (recommendation) => recommendation.code === "stalled_project",
    ).length,
  };

  return {
    agenda,
    recommendations: ruleRecommendations,
    summary: {
      agendaCount: agenda.length,
      highPriorityCount: ruleRecommendations.filter(
        (recommendation) => recommendation.priority === "high",
      ).length,
      lowPriorityCount: ruleRecommendations.filter(
        (recommendation) => recommendation.priority === "low",
      ).length,
      mediumPriorityCount: ruleRecommendations.filter(
        (recommendation) => recommendation.priority === "medium",
      ).length,
      recommendationCount: ruleRecommendations.length,
      triggeredRuleCount: Object.values(triggeredRuleCounts).reduce(
        (total, count) => total + count,
        0,
      ),
      triggeredRuleCounts,
    },
  };
}
