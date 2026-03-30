"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Mail, Inbox } from "lucide-react";

interface EmailPreviewPanelProps {
  subject: string;
  body: string;
  isStreaming: boolean;
  onRegenerate: () => void;
  onBodyChange: (body: string) => void;
}

export default function EmailPreviewPanel({
  subject,
  body,
  isStreaming,
  onRegenerate,
  onBodyChange,
}: EmailPreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullEmail = subject ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = subject || body;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
            <Mail className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Email Preview
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium text-blue-600">
                Writing...
              </span>
            </div>
          )}
          {hasContent && !isStreaming && (
            <>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97]"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition-all active:scale-[0.97] ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {hasContent ? (
        <>
          {/* Subject line */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Subject
              </span>
              <span className="text-sm font-medium text-slate-800">
                {subject || "Generating..."}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-5">
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              readOnly={isStreaming}
              className="h-full w-full resize-none border-none bg-transparent text-sm leading-7 text-slate-700 placeholder:text-slate-300 focus:outline-none"
              placeholder="Email content will appear here..."
            />
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 mb-4">
            <Inbox className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-400">
            No email generated yet
          </p>
          <p className="mt-1 text-xs text-slate-400/80 text-center max-w-[220px] leading-relaxed">
            Select a record and automation type, then click Generate
          </p>
        </div>
      )}
    </div>
  );
}
