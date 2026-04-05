import type { Dispatch } from "@/types/q360";

export function computeDaysOverdue(dispatch: Dispatch, today: Date): number {
  const tryDate = (val: string | null): Date | null => {
    if (!val || val === ".00" || val.trim() === "") return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const deadline =
    tryDate(dispatch.estfixtime) ??
    (() => {
      const opened = tryDate(dispatch.date);
      if (!opened) return null;
      return new Date(opened.getTime() + 7 * 86400000);
    })();

  if (!deadline) return 0;
  return Math.floor((today.getTime() - deadline.getTime()) / 86400000);
}
