/**
 * Workflow topic metadata and AI-backed (or fallback) step generation for the workflows page.
 */
export type WorkflowGuideResult = {
  title: string;
  summary: string;
  steps: string[];
  followUps: string[];
  sourceLabel: string;
};

const DEFAULT_GUIDE: WorkflowGuideResult = {
  title: "Employee workflow guide",
  summary:
    "This guide gives you a practical step-by-step path you can follow during the demo even when shared AI workflow generation is not connected yet.",
  steps: [
    "Identify the record or task you are acting on before making updates.",
    "Review the current dispatch, customer, or time-entry details so your next action is based on the latest context.",
    "Complete the operational step first, then update the system notes or status.",
    "Confirm whether the customer or internal team needs a follow-up message before closing out the work.",
    "Log your time and final notes so the next employee can understand what happened without extra back-and-forth.",
  ],
  followUps: [
    "If the task is customer-facing, confirm the handoff message before leaving the site.",
    "If equipment or parts are involved, note that requirement for the next workflow step.",
  ],
  sourceLabel: "Local fallback guide",
};

export function generateWorkflowGuide(prompt: string): WorkflowGuideResult {
  const normalized = prompt.trim().toLowerCase();

  if (!normalized) {
    return {
      ...DEFAULT_GUIDE,
      summary:
        "Enter a workflow question like closing a dispatch, logging time, or updating a customer, and this page will return a structured guide.",
    };
  }

  if (matches(normalized, ["close", "dispatch"])) {
    return {
      title: "How to close a dispatch",
      summary:
        "Use this sequence when service work is done and you need to leave a clean, traceable dispatch record for the customer and internal team.",
      steps: [
        "Open the dispatch record and confirm the service issue, site, and technician assignment match the job you completed.",
        "Review the problem and solution notes, then add any missing completion details while the work is still fresh.",
        "Verify whether the customer needs a verbal or written update before you close the record.",
        "Check time entries and make sure labor or travel time is logged before final status changes.",
        "Update the dispatch status to the correct closed or completed state and save the final notes.",
      ],
      followUps: [
        "If anything is still pending, do not close the dispatch fully; leave a clear note about what remains.",
        "Use the later Team 2 drafting slot for internal follow-up or customer-ready messaging if needed.",
      ],
      sourceLabel: "Workflow fallback: dispatch closeout",
    };
  }

  if (matches(normalized, ["log", "time"])) {
    return {
      title: "How to log time after a service call",
      summary:
        "Use this after finishing work so billing, reporting, and handoff notes stay aligned with the actual service performed.",
      steps: [
        "Identify the dispatch or work item the time should be attached to before entering any hours.",
        "Record the work category, time spent, and whether travel should be tracked separately.",
        "Write a short, useful note that explains what work was actually performed on site or remotely.",
        "Review the entry for obvious mistakes like the wrong dispatch number or missing duration.",
        "Save the entry and confirm it appears in the recent time log before leaving the page.",
      ],
      followUps: [
        "If the note is customer-facing later, make sure it avoids internal shorthand.",
        "If travel time was significant, confirm it is logged in the correct bucket before ending the workflow.",
      ],
      sourceLabel: "Workflow fallback: time logging",
    };
  }

  if (matches(normalized, ["update", "customer"])) {
    return {
      title: "How to update a customer before leaving a site",
      summary:
        "Use this when you need a clean customer handoff that explains work status, next steps, and any follow-up expectations.",
      steps: [
        "Review the dispatch notes so your update matches the actual work completed.",
        "Decide whether the customer needs a quick verbal summary, written summary, or both.",
        "Explain the problem, what was done, and whether any next step is still open.",
        "Confirm any promised follow-up such as parts ordering, scheduling, or internal review.",
        "Log the communication in the dispatch notes so the team can see what was shared.",
      ],
      followUps: [
        "If the customer asks for written confirmation, use the later drafting integration point instead of rewriting from scratch.",
        "If no follow-up is needed, say that clearly so the customer understands the work is complete.",
      ],
      sourceLabel: "Workflow fallback: customer update",
    };
  }

  if (matches(normalized, ["troubleshoot", "alarm"]) || matches(normalized, ["knowledge", "base"])) {
    return {
      title: "How to run a troubleshooting workflow",
      summary:
        "Use this when the employee needs a repeatable troubleshooting path before escalating the issue or closing the job.",
      steps: [
        "Confirm the exact symptom, equipment context, and recent history from the dispatch or prior notes.",
        "Check the known troubleshooting sequence for the product or service type before trying ad hoc fixes.",
        "Document each test or observation so the next technician can follow the reasoning.",
        "If the issue remains unresolved, capture the escalation details and what was already attempted.",
        "Update the dispatch notes with the findings before moving on to the next task.",
      ],
      followUps: [
        "Later Team 2 knowledge-base search can replace or enrich this fallback guide.",
        "If the issue affects safety or critical service, escalate before trying additional non-approved steps.",
      ],
      sourceLabel: "Workflow fallback: troubleshooting",
    };
  }

  return {
    ...DEFAULT_GUIDE,
    summary:
      "This prompt does not have a dedicated workflow template yet, so the guide below gives a safe general process the employee can follow and later refine with AI support.",
  };
}

function matches(text: string, terms: string[]) {
  return terms.every((term) => text.includes(term));
}
