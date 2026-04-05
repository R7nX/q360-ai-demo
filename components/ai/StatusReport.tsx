"use client";

import { useCallback, useState } from "react";
import { ClipboardList } from "lucide-react";
import { API } from "@/lib/constants";
import type { AiEntityType, AiToolResponse, ToneOption } from "@/types/feature2";

interface StatusReportProps {
  entityId: string;
  entityType?: AiEntityType;
  intent?: string;
  audience?: "manager" | "customer" | "technician" | "internal";
  tone?: ToneOption;
  context?: Record<string, unknown>;
}

export default function StatusReport({
  entityId,
  entityType = "dispatch",
  intent = "status-report",
  audience = "manager",
  tone = "professional",
  context,
}: StatusReportProps) {
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.AI_STATUS_REPORT, {
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
          data.message || `Failed to generate status report (${response.status})`
        );
      }

      setReport(data.result.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status report generation failed."
      );
    } finally {
      setIsLoading(false);
    }
  }, [audience, context, entityId, entityType, intent, tone]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <ClipboardList className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Status Report</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !entityId}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isLoading || !entityId
              ? "bg-slate-100 text-slate-400"
              : "bg-indigo-600 text-white hover:brightness-110"
          }`}
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-700">
          {report || "Generate to create a structured status report."}
        </pre>
      </div>
    </div>
  );
}
