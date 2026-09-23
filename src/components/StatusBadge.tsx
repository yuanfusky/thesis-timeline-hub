import { cn } from "@/lib/utils";
import type { Priority, WorkflowState } from "@/lib/types";

const STATUS_CLASS: Record<WorkflowState, string> = {
  Saved: "bg-status-saved-soft text-status-saved",
  "To Apply": "bg-status-toapply-soft text-status-toapply",
  Applied: "bg-status-applied-soft text-status-applied",
  Interview: "bg-status-interview-soft text-status-interview",
  Offer: "bg-status-offer-soft text-status-offer",
  Rejected: "bg-status-rejected-soft text-status-rejected",
  Withdrawn: "bg-status-saved-soft text-status-saved",
};

const DOT_CLASS: Record<WorkflowState, string> = {
  Saved: "bg-status-saved",
  "To Apply": "bg-status-toapply",
  Applied: "bg-status-applied",
  Interview: "bg-status-interview",
  Offer: "bg-status-offer",
  Rejected: "bg-status-rejected",
  Withdrawn: "bg-status-saved",
};

export function StatusBadge({
  state,
  className,
}: {
  state: WorkflowState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASS[state],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASS[state])} />
      {state}
    </span>
  );
}

export function StatusDot({ state }: { state: WorkflowState }) {
  return <span className={cn("size-2 rounded-full", DOT_CLASS[state])} />;
}

export function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
      {label}
    </span>
  );
}

const PRIORITY_CLASS: Record<Priority, string> = {
  High: "text-foreground",
  Medium: "text-muted-foreground",
  Low: "text-muted-foreground/70",
};

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        PRIORITY_CLASS[priority],
      )}
    >
      <span
        className={cn(
          "inline-block h-3 w-[3px] rounded-full",
          priority === "High"
            ? "bg-status-rejected"
            : priority === "Medium"
              ? "bg-status-interview"
              : "bg-border",
        )}
      />
      {priority}
    </span>
  );
}
