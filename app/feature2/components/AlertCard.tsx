import type { OverdueAlert } from "@/types/feature2";
import { AlertTriangle, Clock, User, MapPin, Wrench } from "lucide-react";

interface Props {
  alert: OverdueAlert;
}

const TIER_STYLES = {
  CRITICAL: {
    border: "border-red-300",
    bg: "bg-red-50",
    badge: "bg-red-600 text-white",
    icon: "text-red-500",
    action: "bg-red-100 border-red-200 text-red-800",
  },
  HIGH: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    badge: "bg-amber-500 text-white",
    icon: "text-amber-500",
    action: "bg-amber-100 border-amber-200 text-amber-800",
  },
  MEDIUM: {
    border: "border-yellow-300",
    bg: "bg-yellow-50",
    badge: "bg-yellow-500 text-white",
    icon: "text-yellow-500",
    action: "bg-yellow-100 border-yellow-200 text-yellow-800",
  },
};

export default function AlertCard({ alert }: Props) {
  const styles = TIER_STYLES[alert.urgencyTier];

  return (
    <div className={`rounded-xl border-2 ${styles.border} ${styles.bg} p-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className={`h-4 w-4 shrink-0 ${styles.icon}`} />
          <span className="font-bold text-slate-800 text-sm truncate">{alert.dispatchno}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}>
            {alert.urgencyTier}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-slate-700 text-white px-2.5 py-0.5 text-[11px] font-bold">
            <Clock className="h-3 w-3" />{alert.daysOverdue}d
          </span>
        </div>
      </div>

      {/* Customer & site */}
      <p className="text-sm font-semibold text-slate-800 mb-0.5">{alert.customer}</p>
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
        <MapPin className="h-3 w-3 shrink-0" />{alert.site}
      </div>

      {/* Problem */}
      <div className="flex items-start gap-1 mb-3">
        <Wrench className="h-3 w-3 mt-0.5 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-600 line-clamp-2">{alert.problem}</p>
      </div>

      {/* Tech + priority */}
      <div className="flex items-center gap-1 mb-3">
        <User className="h-3 w-3 shrink-0 text-slate-400" />
        {alert.techAssigned
          ? <span className="text-xs text-slate-600">{alert.techAssigned}</span>
          : <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Unassigned</span>
        }
        {alert.priority && (
          <span className="ml-auto text-[11px] text-slate-400">Priority {alert.priority}</span>
        )}
      </div>

      {/* AI summary */}
      <p className="text-xs italic text-slate-600 mb-2 leading-relaxed">&ldquo;{alert.aiSummary}&rdquo;</p>

      {/* Action */}
      <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${styles.action}`}>
        <span className="uppercase tracking-wide font-bold text-[10px] mr-1">Action:</span>
        {alert.recommendedAction}
      </div>
    </div>
  );
}
