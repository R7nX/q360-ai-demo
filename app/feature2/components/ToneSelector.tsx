/**
 * Radio-style tone picker (professional / friendly / concise) for generated emails.
 */
"use client";

import type { ToneOption } from "@/types/feature2";

interface ToneSelectorProps {
  selected: ToneOption;
  onSelect: (tone: ToneOption) => void;
}

const TONES: { value: ToneOption; label: string; hint: string }[] = [
  { value: "professional", label: "Professional", hint: "Formal & polished" },
  { value: "friendly", label: "Friendly", hint: "Warm & approachable" },
  { value: "concise", label: "Concise", hint: "Short & direct" },
];

export default function ToneSelector({
  selected,
  onSelect,
}: ToneSelectorProps) {
  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
        Tone
      </label>
      <div className="flex gap-2">
        {TONES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all active:scale-[0.96] ${
              selected === value
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
