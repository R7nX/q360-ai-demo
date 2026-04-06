"use client";

import { useState } from "react";

import {
  generateWorkflowGuide,
  type WorkflowGuideResult,
} from "@/lib/employeeWorkflowGuide";

type WorkflowGuideProps = {
  starterPrompt: string;
  examples: string[];
};

export function WorkflowGuide({
  starterPrompt,
  examples,
}: WorkflowGuideProps) {
  const [prompt, setPrompt] = useState(starterPrompt);
  const [result, setResult] = useState<WorkflowGuideResult>(
    generateWorkflowGuide(starterPrompt)
  );

  function handleGenerate() {
    setResult(generateWorkflowGuide(prompt));
  }

  function handleExampleClick(example: string) {
    setPrompt(example);
    setResult(generateWorkflowGuide(example));
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Workflow Prompt
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Ask how to do a task
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This stage provides a structured workflow experience now, and the
              page can later swap to Team 2 AI support without changing the user
              flow.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Fallback workflow engine
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Workflow question
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none"
              placeholder="How do I close a dispatch?"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Generate workflow
            </button>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Generated Guide
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              {result.title}
            </h3>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {result.sourceLabel}
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          {result.summary}
        </p>

        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Team 2 AI integration is still blocked in this workspace, so this page
          is using the structured fallback workflow engine instead of a shared AI
          route.
        </div>

        <div className="mt-6 grid gap-4">
          {result.steps.map((step, index) => (
            <article
              key={`${index + 1}-${step}`}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[52px_1fr]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-700">
                {index + 1}
              </div>
              <div className="flex items-center text-sm leading-7 text-slate-700">
                {step}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Follow-up checks
          </p>
          <div className="mt-4 grid gap-3">
            {result.followUps.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
