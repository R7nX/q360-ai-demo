/**
 * Feature 2 “Automated Utility Suite” page: pick a dispatch, automation type, and tone; stream or preview email output.
 */
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Sparkles, Zap, ScanSearch } from "lucide-react";
import RecordSelector from "./components/RecordSelector";
import AutomationTypeCard from "./components/AutomationTypeCard";
import ToneSelector from "./components/ToneSelector";
import EmailPreviewPanel from "./components/EmailPreviewPanel";
import EmailDrafter from "@/components/ai/EmailDrafter";
import DataSummary from "@/components/ai/DataSummary";
import ActionRecommender from "@/components/ai/ActionRecommender";
import StatusReport from "@/components/ai/StatusReport";
import SmartReply from "@/components/ai/SmartReply";
import type { AutomationType, ToneOption, RecordSummary } from "@/types/feature2";

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

  const harnessEntityId = selectedRecord?.id ?? "D-0009";
  const harnessContext = selectedRecord
    ? {
        selectedRecord: {
          id: selectedRecord.id,
          customerName: selectedRecord.customerName,
          siteName: selectedRecord.siteName,
          status: selectedRecord.status,
          problem: selectedRecord.problem,
        },
      }
    : undefined;

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
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
              className="ml-auto flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <ScanSearch className="h-4 w-4" />
              Overdue Alert
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
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

            <section className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  3
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Configure and Generate
                </h2>
              </div>

              <div className="space-y-3">
                <ToneSelector selected={tone} onSelect={setTone} />

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    canGenerate
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-[0.98]"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
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

                {error ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}
              </div>
            </section>
          </div>

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

      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Shared Tool Harness
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Feature 2 Component Gallery
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Shared components are mounted using entity{" "}
              <span className="font-semibold text-slate-800">{harnessEntityId}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EmailDrafter
              entityId={harnessEntityId}
              tone={tone}
              context={harnessContext}
            />
            <DataSummary
              entityId={harnessEntityId}
              tone={tone}
              context={harnessContext}
            />
            <StatusReport
              entityId={harnessEntityId}
              tone={tone}
              context={harnessContext}
            />
            <ActionRecommender
              entityId={harnessEntityId}
              tone={tone}
              context={harnessContext}
            />
            <SmartReply
              entityId={harnessEntityId}
              tone={tone}
              defaultInboundMessage="Hi team, can you share an update on this service call and when we should expect closure?"
              context={harnessContext}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
