/**
 * Static workflow guidance (dispatch follow-up, service steps) for field employees.
 */
import ActionRecommender from "@/components/ai/ActionRecommender";
import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import { WorkflowGuide } from "@/components/ai/employee/WorkflowGuide";
import {
  CURRENT_EMPLOYEE,
  getEmployeeDispatchSummaries,
} from "@/lib/employeeHome";

export default async function WorkflowsPage() {
  const dispatches = await getEmployeeDispatchSummaries(CURRENT_EMPLOYEE);
  const primaryDispatchId = dispatches[0]?.dispatchno ?? "";

  return (
    <>
      <EmployeeHeader
        title="Workflows"
        description="Get step-by-step help for common employee tasks, from dispatch follow-up to service workflow guidance."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <WorkflowGuide
          starterPrompt="How do I close a dispatch?"
          examples={[
            "How do I close a dispatch?",
            "How do I log time after a service call?",
            "How do I update a customer before leaving a site?",
          ]}
        />
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Team 2 AI Workflow Assist
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Suggested next actions for your active dispatch
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use the shared recommender to get AI-prioritized follow-up steps while
            keeping the local workflow guide available as a fallback.
          </p>
          <div className="mt-4">
            <ActionRecommender
              entityType="dispatch"
              entityId={primaryDispatchId}
              intent="recommend"
              audience="technician"
              tone="professional"
              context={{
                currentUser: CURRENT_EMPLOYEE,
                workflowPage: true,
              }}
            />
          </div>
        </section>
      </section>
    </>
  );
}
