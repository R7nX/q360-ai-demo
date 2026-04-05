/**
 * Marketing-style landing page linking to feature demos (command center, utility suite, employee hub).
 */
import Link from "next/link";
import { Zap, LayoutDashboard, GitBranch, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    number: "01",
    title: "Intelligent Command Center",
    description:
      "AI-powered dashboard with smart \"Next Steps\" recommendations, NLP-weighted deadline prioritization, and real-time insights across all active service calls.",
    icon: LayoutDashboard,
    href: "/feature1",
    gradient: "from-violet-500 to-purple-600",
    ring: "ring-violet-200",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    team: "Team 1",
    active: false,
  },
  {
    number: "02",
    title: "Automated Utility Suite",
    description:
      "Select any Q360 dispatch and instantly generate a professional email — project status updates, service closure reports, overdue alerts — streamed live by AI.",
    icon: Zap,
    href: "/feature2",
    gradient: "from-blue-500 to-indigo-600",
    ring: "ring-blue-200",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    team: "Team 2",
    active: true,
  },
  {
    number: "03",
    title: "Dynamic Workflow Architect",
    description:
      "AI-generated workflow recommendations with automated resource assignments and visual diagrams — turning complex service data into actionable process maps.",
    icon: GitBranch,
    href: "/home",
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    team: "Team 3",
    active: true,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Q360 AI Demo
              </span>
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                Beta
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Powered by AI + Q360
          </p>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            AI-Enhanced Field Service
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-500">
            Three intelligent features that reduce manual work, surface
            proactive insights, and automate the most repetitive Q360 workflows
            — all powered by generative AI.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.number}
                className={`group relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 ${
                  f.active
                    ? "border-blue-200 shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15"
                    : "border-slate-200 hover:shadow-md"
                }`}
              >
                {/* Team badge */}
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    {f.team}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">
                    {f.number}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                    f.active
                      ? `bg-gradient-to-br ${f.gradient} shadow-md`
                      : f.bg
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${f.active ? "text-white" : f.iconColor}`}
                  />
                </div>

                {/* Text */}
                <h2 className="mb-2 text-base font-bold text-slate-900">
                  {f.title}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-slate-500">
                  {f.description}
                </p>

                {/* CTA */}
                <div className="mt-6">
                  {f.active ? (
                    <Link
                      href={f.href}
                      className={`group/btn flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${f.gradient} px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]`}
                    >
                      Launch Demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400">
                      Coming soon
                    </div>
                  )}
                </div>

                {/* Active indicator */}
                {f.active && (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    <span className="text-[10px] font-semibold text-blue-600">
                      Live
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6">
        <p className="text-center text-xs text-slate-400">
          Q360 AI Demo &mdash; Internship Capstone Project &mdash; Spring 2026
        </p>
      </footer>
    </div>
  );
}
