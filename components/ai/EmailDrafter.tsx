"use client";

/**
 * EmailDrafter — shared AI email drafting component (Team 2)
 *
 * Teams 1 and 3 import this component and pass their entity context as props.
 * The component handles all state, API calls, and streaming internally.
 *
 * Usage:
 *   import EmailDrafter from "@/components/ai/EmailDrafter";
 *
 *   // Service closure (Team 1 — after closing a dispatch)
 *   <EmailDrafter entityId={dispatch.id} intent="service-closure" audience="customer" />
 *
 *   // New call acknowledgement (Team 3 — after a call is logged)
 *   <EmailDrafter entityId={call.id} intent="new-call-ack" audience="customer" defaultTone="friendly" />
 */

import { useState, useCallback } from "react";
import { Sparkles, Copy, RefreshCw, Check } from "lucide-react";
import type { ToneOption } from "@/types/feature2";

type Intent =
  | "project-status"
  | "service-closure"
  | "overdue-alert"
  | "new-call-ack";

type Audience = "customer" | "internal" | "manager" | "technician";

interface EmailDrafterProps {
  entityId: string;
  entityType?: string;
  intent: Intent;
  audience?: Audience;
  defaultTone?: ToneOption;
  /** Override the Generate button label */
  label?: string;
}

const TONE_LABELS: Record<ToneOption, string> = {
  professional: "Professional",
  friendly: "Friendly",
  concise: "Concise",
};

const INTENT_LABELS: Record<Intent, string> = {
  "project-status": "Project Status Email",
  "service-closure": "Service Closure Report",
  "overdue-alert": "Overdue Alert",
  "new-call-ack": "New Call Acknowledgement",
};

export default function EmailDrafter({
  entityId,
  entityType = "dispatch",
  intent,
  audience,
  defaultTone = "professional",
  label,
}: EmailDrafterProps) {
  const [tone, setTone] = useState<ToneOption>(defaultTone);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsStreaming(true);
    setSubject("");
    setBody("");
    setError(null);

    try {
      const res = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, intent, audience, tone }),
      });

      if (!res.ok) {
        throw new Error((await res.text()) || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        const subjectMatch = fullText.match(/^SUBJECT:\s*(.+?)(?:\n\n)/);
        if (subjectMatch) {
          setSubject(subjectMatch[1]);
          setBody(fullText.slice(fullText.indexOf("\n\n") + 2));
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
  }, [entityId, entityType, intent, audience, tone]);

  const handleCopy = useCallback(() => {
    const full = subject ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [subject, body]);

  const hasOutput = subject || body;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {INTENT_LABELS[intent]}
        </p>
        {audience && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500 font-medium capitalize">
            {audience}
          </span>
        )}
      </div>

      {/* Tone selector */}
      <div className="flex gap-2">
        {(Object.keys(TONE_LABELS) as ToneOption[]).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              tone === t
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {TONE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isStreaming}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          isStreaming
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:brightness-110 active:scale-[0.98]"
        }`}
      >
        {isStreaming ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {label ?? `Generate ${INTENT_LABELS[intent]}`}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Output */}
      {(hasOutput || isStreaming) && (
        <div className="space-y-2">
          {/* Subject */}
          {(subject || isStreaming) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Subject
              </span>
              <p className="mt-0.5 text-sm text-slate-800">
                {subject || (
                  <span className="text-slate-300 italic">Generating...</span>
                )}
              </p>
            </div>
          )}

          {/* Body */}
          <div className="relative">
            {isStreaming && (
              <span className="absolute right-3 top-2 flex items-center gap-1 text-[11px] text-blue-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                Writing...
              </span>
            )}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              readOnly={isStreaming}
              rows={8}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 leading-relaxed focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Actions */}
          {!isStreaming && hasOutput && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
