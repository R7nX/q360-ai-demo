/**
 * Selectable tiles for Feature 2 automation kinds (status email, closure, overdue, etc.).
 */
"use client";

import { FileText, FileCheck, AlertTriangle, Bell } from "lucide-react";
import type { AutomationType } from "@/types/feature2";

interface AutomationTypeCardProps {
  selected: AutomationType | null;
  onSelect: (type: AutomationType) => void;
}

const AUTOMATIONS = [
  {
    id: "project-status" as AutomationType,
    title: "Project Status",
    description: "Status update for an active service call",
    Icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
    lightBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "service-closure" as AutomationType,
    title: "Service Closure",
    description: "Completion summary for a closed dispatch",
    Icon: FileCheck,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "overdue-alert" as AutomationType,
    title: "Overdue Alert",
    description: "Internal escalation for past-due calls",
    Icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "new-call-ack" as AutomationType,
    title: "New Call Ack",
    description: "Confirmation for a new service request",
    Icon: Bell,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export default function AutomationTypeCard({
  selected,
  onSelect,
}: AutomationTypeCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {AUTOMATIONS.map(({ id, title, description, Icon, gradient, lightBg, iconColor }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`group relative flex h-[100px] flex-col items-center justify-center text-center gap-1.5 rounded-xl border-2 p-3 transition-all active:scale-[0.98] ${
              isSelected
                ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isSelected
                  ? `bg-gradient-to-br ${gradient} shadow-sm`
                  : lightBg
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isSelected ? "text-white" : iconColor
                }`}
              />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                {description}
              </p>
            </div>
            {isSelected && (
              <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
