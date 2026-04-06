"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Zap, ScanSearch } from "lucide-react";
import RecordSelector from "./components/RecordSelector";
import AutomationTypeCard from "./components/AutomationTypeCard";
import ToneSelector from "./components/ToneSelector";
import EmailPreviewPanel from "./components/EmailPreviewPanel";
import type {
  AutomationType,
  ToneOption,
  RecordSummary,
} from "@/types/feature2";

export default function Feature2Page() {
  const [selectedRecord, setSelectedRecord] = useState<RecordSummary | null>(
    null
  );
  const [automationType, setAutomationType] = useState<AutomationType | null>(
    null
  );
  const [tone, setTone] = useState<ToneOption>("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!selectedRecord || !automationType) return;

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
          recordId: selectedRecord.id,
          automationType,
          tone,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
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
  }, [selectedRecord, automationType, tone]);

  const canGenerate = selectedRecord && automationType && !isStreaming;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Automated Utility Suite
              </h1>
              <p className="text-xs text-slate-500">
                AI-powered email drafting from Q360 service records
              </p>
            </div>
            <Link
              href="/feature2/overdue"
              className="ml-auto flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <ScanSearch className="h-4 w-4" />
              Overdue Alert
            </Link>
          </div>
        </div>
      </header>

      {/* Main content — fills remaining viewport, no scroll */}
      <main className="flex-1 min-h-0">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-2">
          {/* Left panel: Controls */}
          <div className="flex flex-col gap-3">
            {/* Step 1: Record */}
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  1
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Select Record
                </h2>
              </div>
              <RecordSelector
                selectedId={selectedRecord?.id ?? null}
                onSelect={setSelectedRecord}
                automationType={automationType}
              />
            </section>

            {/* Step 2: Automation Type */}
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  2
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Choose Automation
                </h2>
              </div>
              <AutomationTypeCard
                selected={automationType}
                onSelect={(type) => {
                  setAutomationType(type);
                  setSelectedRecord(null);
                }}
              />
            </section>

            {/* Step 3: Tone + Generate */}
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  3
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Configure & Generate
                </h2>
              </div>

              <div className="space-y-3">
                <ToneSelector selected={tone} onSelect={setTone} />

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    canGenerate
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isStreaming ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Generate Email
                    </>
                  )}
                </button>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right panel: Email Preview — fills height */}
          <div className="min-h-0 flex flex-col">
            <EmailPreviewPanel
              subject={subject}
              body={body}
              isStreaming={isStreaming}
              onRegenerate={handleGenerate}
              onBodyChange={setBody}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
