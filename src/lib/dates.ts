import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** The app's "today". Fixed reference so seeded demo data stays meaningful. */
export function today(): Date {
  return new Date();
}

export function fmt(date: string | null | undefined, pattern = "MMM d"): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), pattern);
  } catch {
    return "—";
  }
}

export function fmtLong(date: string | null | undefined): string {
  return fmt(date, "MMM d, yyyy");
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  try {
    return differenceInCalendarDays(parseISO(date), today());
  } catch {
    return null;
  }
}

export function relativeDay(date: string | null | undefined): string {
  const d = daysUntil(date);
  if (d === null) return "";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}
