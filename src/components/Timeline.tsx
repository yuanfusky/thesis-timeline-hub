import { CalendarClock, Trash2 } from "lucide-react";

import { fmtLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ApplicationEvent, EventType } from "@/lib/types";

const ACCENT: Partial<Record<EventType, string>> = {
  "Application Submitted": "bg-status-applied",
  "Interview Invitation": "bg-status-interview",
  "Interview Round 1": "bg-status-interview",
  "Interview Round 2": "bg-status-interview",
  "Technical Interview": "bg-status-interview",
  "HR Interview": "bg-status-interview",
  "Case / Assignment": "bg-status-interview",
  "Offer Received": "bg-status-offer",
  "Rejection Received": "bg-status-rejected",
  "Marked To Apply": "bg-status-toapply",
};

export function Timeline({
  events,
  onDelete,
}: {
  events: ApplicationEvent[];
  onDelete?: (eventId: string) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        No events yet. Add the first one to start the timeline.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => {
        const primary = e.received_at ?? e.event_date;
        return (
          <li key={e.id} className="group relative flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full ring-4 ring-background",
                  ACCENT[e.event_type] ?? "bg-border",
                )}
              />
              {i < events.length - 1 && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 -mt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="num text-muted-foreground">{fmtLong(primary)}</span>
                <span className="text-sm font-medium">{e.event_type}</span>
              </div>
              {e.event_date && e.received_at && e.event_date !== e.received_at && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                  <CalendarClock className="size-3.5 text-status-interview" />
                  <span className="text-muted-foreground">Scheduled for</span>
                  <span className="num">{fmtLong(e.event_date)}</span>
                </div>
              )}
              {e.notes && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {e.notes}
                </p>
              )}
            </div>
            {onDelete && (
              <button
                type="button"
                aria-label={`Delete ${e.event_type} event`}
                onClick={() => onDelete(e.id)}
                className="mt-0.5 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
