/**
 * Client widget that calls `/api/ai/summarize` and shows condensed output plus actions.
 */
"use client";

import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import { API } from "@/lib/constants";
import type { AiEntityType, AiToolResponse, ToneOption } from "@/types/feature2";

interface DataSummaryProps {
  entityId: string;
  entityType?: AiEntityType;
  intent?: string;
  audience?: "manager" | "customer" | "technician" | "internal";
  tone?: ToneOption;
  context?: Record<string, unknown>;
}

export default function DataSummary({
  entityId,
  entityType = "dispatch",
  intent = "summary",
  audience = "internal",
  tone = "professional",
  context,
}: DataSummaryProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.AI_SUMMARIZE, {
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
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      setSummary(data.result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize.");
    } finally {
      setIsLoading(false);
    }
  }, [audience, context, entityId, entityType, intent, tone]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Data Summary</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !entityId}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isLoading || !entityId
              ? "bg-slate-100 text-slate-400"
              : "bg-blue-600 text-white hover:brightness-110"
          }`}
        >
          {isLoading ? "Summarizing..." : "Generate"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs leading-5 text-slate-700 whitespace-pre-wrap">
          {summary || "Generate to get a concise operational summary."}
        </p>
      </div>
    </div>
  );
}
