/**
 * Wraps Feature 2 email preview + tone controls for drafting from a dispatch detail page.
 */
"use client";

import { useCallback, useState } from "react";

import EmailPreviewPanel from "@/app/feature2/components/EmailPreviewPanel";
import ToneSelector from "@/app/feature2/components/ToneSelector";
import type { ToneOption } from "@/types/feature2";

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
      const res = await fetch("/api/feature2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordType: "dispatch",
          recordId: dispatchNo,
          automationType,
          tone,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        const subjectMatch = fullText.match(/^SUBJECT:\s*(.+?)(?:\n\n)/);
        if (subjectMatch) {
          setSubject(subjectMatch[1]);
          const bodyStart = fullText.indexOf("\n\n") + 2;
          setBody(fullText.slice(bodyStart));
        } else if (fullText.startsWith("SUBJECT:")) {
          setSubject(fullText.replace(/^SUBJECT:\s*/, ""));
        } else {
          setBody(fullText);
        }
      }
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
            Draft a dispatch email from Feature 2
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This panel reuses the existing Team 2 generation route for the
            current dispatch without requiring the employee to leave the detail
            page.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Live Team 2 route
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
