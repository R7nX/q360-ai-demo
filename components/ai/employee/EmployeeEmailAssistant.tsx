/**
 * Wraps Feature 2 email preview + tone controls for drafting from a dispatch detail page.
 */
"use client";

import { useCallback, useState } from "react";

import EmailPreviewPanel from "@/app/feature2/components/EmailPreviewPanel";
import ToneSelector from "@/app/feature2/components/ToneSelector";
import { API } from "@/lib/constants";
import type { AiToolResponse, ToneOption } from "@/types/feature2";

type EmployeeEmailAssistantProps = {
  dispatchNo: string;
};

type EmployeeAutomationType = "service-closure" | "new-call-ack";

const AUTOMATION_OPTIONS: Array<{
  value: EmployeeAutomationType;
  label: string;
  description: string;
}> = [
  {
    value: "service-closure",
    label: "Service Closure",
    description: "Draft an internal completion-style update from dispatch data.",
  },
  {
    value: "new-call-ack",
    label: "New Call Acknowledgement",
    description: "Draft a quick internal acknowledgement or handoff message.",
  },
];

export function EmployeeEmailAssistant({
  dispatchNo,
}: EmployeeEmailAssistantProps) {
  const [automationType, setAutomationType] =
    useState<EmployeeAutomationType>("service-closure");
  const [tone, setTone] = useState<ToneOption>("friendly");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsStreaming(true);
    setSubject("");
    setBody("");
    setError(null);

    try {
      const res = await fetch(`${API.AI_DRAFT_EMAIL}?format=json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "dispatch",
          entityId: dispatchNo,
          intent: automationType,
          audience: "internal",
          tone,
        }),
      });

      const rawBody = await res.text();
      let payload: AiToolResponse | null = null;
      try {
        payload = rawBody ? (JSON.parse(rawBody) as AiToolResponse) : null;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const message =
          payload?.message ||
          rawBody.trim() ||
          `Error ${res.status}: failed to generate draft.`;
        throw new Error(message);
      }

      if (!payload) {
        throw new Error("Invalid response from draft-email route.");
      }

      if (!payload.success || !payload.result) {
        throw new Error(payload.message || "Generation failed.");
      }
      setSubject(payload.result.subject ?? "");
      setBody(payload.result.content ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsStreaming(false);
    }
  }, [automationType, dispatchNo, tone]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Team 2 Email Integration
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Draft a dispatch email from shared AI tools
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This panel uses the shared Team 2 draft-email route so employee and
            manager experiences can reuse the same API contract.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Shared /api/ai/draft-email
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Automation Type
            </label>
            <div className="grid gap-2">
              {AUTOMATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAutomationType(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    automationType === option.value
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {option.label}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[240px]">
            <ToneSelector selected={tone} onSelect={setTone} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isStreaming}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
              isStreaming
                ? "bg-slate-200 text-slate-500"
                : "bg-emerald-600 text-white"
            }`}
          >
            {isStreaming ? "Generating..." : "Generate Draft"}
          </button>
          <span className="text-sm text-slate-500">
            Dispatch: {dispatchNo}
          </span>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="min-h-[360px]">
          <EmailPreviewPanel
            subject={subject}
            body={body}
            isStreaming={isStreaming}
            onRegenerate={handleGenerate}
            onBodyChange={setBody}
          />
        </div>
      </div>
    </section>
  );
}
