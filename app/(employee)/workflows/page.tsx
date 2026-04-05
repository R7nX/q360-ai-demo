import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import { WorkflowGuide } from "@/components/ai/employee/WorkflowGuide";

export default function WorkflowsPage() {
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
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Stage 7 Status
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Team 2 workflow-specific guidance is not exposed as a shared route or
            reusable component in this workspace yet, so the workflows page
            continues to use the structured local fallback experience.
          </p>
        </div>
      </section>
    </>
  );
}
