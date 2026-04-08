/**
 * Shared email drafting widget for Team 1 and Team 3 surfaces.
 */
"use client";

import { useCallback, useState } from "react";
import { Check, Copy, MailPlus } from "lucide-react";
import { API } from "@/lib/constants";
import type {
  AiAudience,
  AiEntityType,
  AiToolResponse,
  AiToneOption,
} from "@/types/feature2";

const INTENT_OPTIONS = [
  { value: "project-status", label: "Project Status" },
  { value: "service-closure", label: "Service Closure" },
  { value: "overdue-alert", label: "Overdue Alert" },
  { value: "new-call-ack", label: "New Call Acknowledgement" },
] as const;

type EmailIntent = (typeof INTENT_OPTIONS)[number]["value"];

export interface EmailDrafterProps {
  entityId: string;
  entityType?: AiEntityType;
  audience?: AiAudience;
  tone?: AiToneOption;
  context?: Record<string, unknown>;
  defaultIntent?: EmailIntent;
}

export function EmailDrafter({
  entityId,
  entityType = "dispatch",
  audience = "internal",
  tone = "professional",
  context,
  defaultIntent = "project-status",
}: EmailDrafterProps) {
  const [intent, setIntent] = useState<EmailIntent>(defaultIntent);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"subject" | "content" | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API.AI_DRAFT_EMAIL}?format=json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          intent,
          audience,
          tone,
          context,
        }),
      });

      const data = (await response.json()) as AiToolResponse;
      if (!response.ok || !data.success || !data.result) {
        throw new Error(
          data.message || `Failed to generate draft (${response.status})`
        );
      }

      setSubject(data.result.subject ?? "");
      setContent(data.result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft generation failed.");
    } finally {
      setIsLoading(false);
    }
  }, [audience, context, entityId, entityType, intent, tone]);

  const copyText = useCallback(async (value: string, field: "subject" | "content") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <MailPlus className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Email Drafter</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !entityId}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isLoading || !entityId
              ? "bg-slate-100 text-slate-400"
              : "bg-sky-600 text-white hover:brightness-110"
          }`}
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Draft Intent
        </span>
        <select
          value={intent}
          onChange={(event) => setIntent(event.target.value as EmailIntent)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {INTENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Subject
            </p>
            <button
              type="button"
              onClick={() => copyText(subject, "subject")}
              disabled={!subject}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 disabled:text-slate-300"
            >
              {copied === "subject" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-slate-800">
            {subject || "Generate to get a suggested subject line."}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Draft Body
            </p>
            <button
              type="button"
              onClick={() => copyText(content, "content")}
              disabled={!content}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 disabled:text-slate-300"
            >
              {copied === "content" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-700">
            {content || "Generate to draft a reusable email from shared AI tools."}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default EmailDrafter;
