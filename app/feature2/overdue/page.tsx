/**
 * Overdue dispatch scanner UI: calls /api/feature2/overdue and renders urgency tiers and alert cards.
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ScanSearch, ArrowLeft, CheckCircle2, Inbox, AlertTriangle } from "lucide-react";
import AlertCard from "../components/AlertCard";
import StatsSummaryBar from "../components/StatsSummaryBar";
import type { OverdueAlert, OverdueApiResponse, UrgencyTier } from "@/types/feature2";

type ScanState = "idle" | "fetching" | "analyzing" | "done" | "error";
type FilterTier = "ALL" | UrgencyTier;
type SortKey = "urgency" | "days" | "customer";

const TIER_ORDER: Record<UrgencyTier, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };

export default function OverduePage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<OverdueApiResponse | null>(null);
  const [filterTier, setFilterTier] = useState<FilterTier>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("urgency");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleScan() {
    setScanState("fetching");
    setResult(null);
    setErrorMsg(null);
    setFilterTier("ALL");

    const phase2Timer = setTimeout(() => setScanState("analyzing"), 1500);

    try {
      const res = await fetch("/api/feature2/overdue", { method: "POST" });
      clearTimeout(phase2Timer);

      if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);

      const data = (await res.json()) as OverdueApiResponse;
      setResult(data);
      setScanState("done");
    } catch (err) {
      clearTimeout(phase2Timer);
      setErrorMsg(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setScanState("error");
    }
  }

  const filteredAlerts = useMemo(() => {
    if (!result?.data) return [];
    let alerts: OverdueAlert[] = result.data.alerts;
    if (filterTier !== "ALL") alerts = alerts.filter((a) => a.urgencyTier === filterTier);
    return [...alerts].sort((a, b) => {
      if (sortKey === "urgency") {
        const diff = TIER_ORDER[a.urgencyTier] - TIER_ORDER[b.urgencyTier];
        return diff !== 0 ? diff : b.daysOverdue - a.daysOverdue;
      }
      if (sortKey === "days") return b.daysOverdue - a.daysOverdue;
      return a.customer.localeCompare(b.customer);
    });
  }, [result, filterTier, sortKey]);

  const isScanning = scanState === "fetching" || scanState === "analyzing";

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/feature2" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />Back
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-500/20">
                <ScanSearch className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Overdue Dispatch Alert</h1>
                <p className="text-xs text-slate-500">AI-powered scan of all open service calls past their SLA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">

          {/* Scan button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className={`flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-bold shadow-lg transition-all ${
                isScanning
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30 hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
              }`}
            >
              {isScanning ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  {scanState === "fetching" ? "Fetching open dispatches..." : "AI is analyzing overdue dispatches..."}
                </>
              ) : (
                <><ScanSearch className="h-5 w-5" />Scan for Overdue Dispatches</>
              )}
            </button>
            {scanState === "idle" && (
              <p className="text-xs text-slate-400">Scans all open service calls and identifies which are past their estimated fix time</p>
            )}
          </div>

          {/* Error */}
          {scanState === "error" && errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{errorMsg}
            </div>
          )}

          {/* Results */}
          {scanState === "done" && result && (
            <>
              {result.state === "empty" || result.state === "all_clear" ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">
                    {result.state === "empty" ? "No open dispatches found." : "All dispatches are within SLA."}
                  </p>
                  {result.message && <p className="text-sm text-green-600 mt-1">{result.message}</p>}
                </div>
              ) : result.data ? (
                <>
                  <StatsSummaryBar summary={result.data.summary} />

                  {/* Filter + sort */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      {(["ALL", "CRITICAL", "HIGH", "MEDIUM"] as FilterTier[]).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setFilterTier(tier)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                            filterTier === tier
                              ? tier === "ALL" ? "bg-slate-800 text-white"
                                : tier === "CRITICAL" ? "bg-red-600 text-white"
                                : tier === "HIGH" ? "bg-amber-500 text-white"
                                : "bg-yellow-500 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tier}
                          {tier !== "ALL" && result.data && (
                            <span className="ml-1 opacity-75">
                              ({tier === "CRITICAL" ? result.data.summary.critical
                                : tier === "HIGH" ? result.data.summary.high
                                : result.data.summary.medium})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm"
                    >
                      <option value="urgency">Sort: Urgency</option>
                      <option value="days">Sort: Days Overdue</option>
                      <option value="customer">Sort: Customer</option>
                    </select>
                  </div>

                  {/* Cards */}
                  {filteredAlerts.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center">
                      <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No alerts match this filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {filteredAlerts.map((alert) => (
                        <AlertCard key={alert.dispatchno} alert={alert} />
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
