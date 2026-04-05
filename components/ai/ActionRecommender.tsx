/**
 * Client widget that calls `/api/ai/recommend` and renders ranked next-step suggestions.
 */
"use client";

import { useCallback, useState } from "react";
import { ListChecks } from "lucide-react";
import { API } from "@/lib/constants";
import type { AiEntityType, AiToolResponse, ToneOption } from "@/types/feature2";

interface ActionRecommenderProps {
  entityId: string;
  entityType?: AiEntityType;
  intent?: string;
  audience?: "manager" | "customer" | "technician" | "internal";
  tone?: ToneOption;
  context?: Record<string, unknown>;
}

export default function ActionRecommender({
  entityId,
  entityType = "dispatch",
  intent = "recommend",
  audience = "manager",
  tone = "professional",
  context,
}: ActionRecommenderProps) {
  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState<
    Array<{
      action: string;
      priority: string;
      assignTo: string;
      reasoning: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.AI_RECOMMEND, {
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
          data.message || `Failed to generate recommendations (${response.status})`
        );
      }

      setSummary(data.result.content);
      setActions(data.result.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommendation failed.");
    } finally {
      setIsLoading(false);
    }
  }, [audience, context, entityId, entityType, intent, tone]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <ListChecks className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Action Recommender</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !entityId}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isLoading || !entityId
              ? "bg-slate-100 text-slate-400"
              : "bg-amber-600 text-white hover:brightness-110"
          }`}
        >
          {isLoading ? "Analyzing..." : "Generate"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-slate-700 whitespace-pre-wrap">
        {summary || "Generate to get recommended next steps."}
      </p>

      {actions.length > 0 ? (
        <ol className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {actions.map((item, index) => (
            <li key={`${item.action}-${index}`} className="space-y-1">
              <p className="font-semibold text-slate-800">
                {index + 1}. {item.action}
              </p>
              <p>
                Priority: <span className="font-medium">{item.priority}</span> | Owner:{" "}
                <span className="font-medium">{item.assignTo}</span>
              </p>
              <p>{item.reasoning}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
