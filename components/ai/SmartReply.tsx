/**
 * Client widget that calls `/api/ai/smart-reply` and offers copy-to-clipboard for suggested text.
 */
"use client";

import { useCallback, useState } from "react";
import { MessageSquareReply, Copy, Check } from "lucide-react";
import { API } from "@/lib/constants";
import type {
  AiEntityType,
  AiToolResponse,
  AiToneOption,
} from "@/types/feature2";

export interface SmartReplyProps {
  entityId: string;
  entityType?: AiEntityType;
  intent?: string;
  audience?: "manager" | "customer" | "technician" | "internal";
  tone?: AiToneOption;
  context?: Record<string, unknown>;
  defaultInboundMessage?: string;
}

export function SmartReply({
  entityId,
  entityType = "dispatch",
  intent = "smart-reply",
  audience = "customer",
  tone = "friendly",
  context,
  defaultInboundMessage = "",
}: SmartReplyProps) {
  const [inboundMessage, setInboundMessage] = useState(defaultInboundMessage);
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!entityId || !inboundMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.AI_SMART_REPLY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          intent,
          audience,
          tone,
          inboundMessage,
          context,
        }),
      });

      const data = (await response.json()) as AiToolResponse;
      if (!response.ok || !data.success || !data.result) {
        throw new Error(
          data.message || `Failed to generate smart reply (${response.status})`
        );
      }

      setReply(data.result.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Smart reply generation failed."
      );
    } finally {
      setIsLoading(false);
    }
  }, [audience, context, entityId, entityType, inboundMessage, intent, tone]);

  const handleCopy = useCallback(() => {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [reply]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <MessageSquareReply className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Smart Reply</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !entityId || inboundMessage.trim() === ""}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isLoading || !entityId || inboundMessage.trim() === ""
              ? "bg-slate-100 text-slate-400"
              : "bg-emerald-600 text-white hover:brightness-110"
          }`}
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      <textarea
        value={inboundMessage}
        onChange={(event) => setInboundMessage(event.target.value)}
        placeholder="Paste the inbound customer/teammate message here..."
        rows={4}
        className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-700">
          {reply || "Generate to draft a context-aware response."}
        </pre>
      </div>

      {reply ? (
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Reply
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export default SmartReply;
