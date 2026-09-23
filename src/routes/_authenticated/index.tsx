import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Send } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { JobDrawer } from "@/components/JobDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { daysUntil, fmtLong, relativeDay } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Master Thesis Tracker" },
      {
        name: "description",
        content:
          "Overview of tracked master thesis opportunities: deadlines, upcoming interviews and recent application activity.",
      },
      { property: "og:title", content: "Dashboard — Master Thesis Tracker" },
      {
        property: "og:description",
        content:
          "Overview of tracked master thesis opportunities: deadlines, upcoming interviews and recent application activity.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { jobs, applications, events } = useStore();
  const [openJob, setOpenJob] = useState<string | null>(null);

  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  const kpis = useMemo(() => {
    const count = (s: string) =>
      applications.filter((a) => a.workflow_state === s).length;
    return [
      { label: "Tracked Jobs", value: jobs.length },
      { label: "To Apply", value: count("To Apply"), tone: "text-status-toapply" },
      { label: "Applied", value: count("Applied"), tone: "text-status-applied" },
      { label: "Interviewing", value: count("Interview"), tone: "text-status-interview" },
      { label: "Offers", value: count("Offer"), tone: "text-status-offer" },
    ];
  }, [jobs, applications]);

  const actions = useMemo(() => {
    type Item = {
      id: string;
      jobId: string;
      company: string;
      title: string;
      reason: string;
      action: string;
      date: string | null;
      sort: number;
      icon: typeof AlertTriangle;
      tone: string;
    };
    const items: Item[] = [];

    for (const app of applications) {
      const job = jobById.get(app.job_id);
      if (!job) continue;
      if (app.workflow_state === "Rejected" || app.workflow_state === "Withdrawn") continue;

      const dl = daysUntil(job.deadline);
      if (!app.applied_at && dl !== null && dl <= 21) {
        items.push({
          id: `${app.id}-dl`,
          jobId: job.id,
          company: job.company,
          title: job.title,
          reason: dl < 0 ? "Deadline passed" : `Deadline ${relativeDay(job.deadline)}`,
          action: "Apply",
          date: job.deadline,
          sort: dl,
          icon: AlertTriangle,
          tone: dl <= 3 ? "text-status-rejected" : "text-status-toapply",
        });
      }

      const upcoming = events
        .filter((e) => e.application_id === app.id && e.event_date)
        .map((e) => ({ e, d: daysUntil(e.event_date) }))
        .filter((x) => x.d !== null && x.d >= 0 && x.d <= 21)
        .sort((a, b) => (a.d as number) - (b.d as number))[0];
      if (upcoming) {
        items.push({
          id: `${upcoming.e.id}-ev`,
          jobId: job.id,
          company: job.company,
          title: job.title,
          reason: `${upcoming.e.event_type} ${relativeDay(upcoming.e.event_date)}`,
          action: "Prepare",
          date: upcoming.e.event_date,
          sort: upcoming.d as number,
          icon: CalendarClock,
          tone: "text-status-interview",
        });
      }

      if (app.workflow_state === "To Apply" && !app.next_action_date && !job.deadline) {
        items.push({
          id: `${app.id}-na`,
          jobId: job.id,
          company: job.company,
          title: job.title,
          reason: "To Apply — no action scheduled",
          action: "Plan",
          date: null,
          sort: 99,
          icon: Send,
          tone: "text-status-saved",
        });
      } else if (app.next_action && app.next_action_date) {
        const d = daysUntil(app.next_action_date);
        if (d !== null && d <= 14) {
          items.push({
            id: `${app.id}-next`,
            jobId: job.id,
            company: job.company,
            title: job.title,
            reason: `${app.next_action} · ${relativeDay(app.next_action_date)}`,
            action: "Next action",
            date: app.next_action_date,
            sort: d,
            icon: Send,
            tone: "text-status-applied",
          });
        }
      }
    }

    const seen = new Set<string>();
    return items
      .sort((a, b) => a.sort - b.sort)
      .filter((i) => {
        const key = `${i.jobId}-${i.action}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [applications, events, jobById]);

  const recent = useMemo(() => {
    const appToJob = new Map(applications.map((a) => [a.id, jobById.get(a.job_id)]));
    return [...events]
      .filter((e) => e.received_at || e.event_date)
      .sort((a, b) =>
        (b.received_at ?? b.event_date ?? "").localeCompare(
          a.received_at ?? a.event_date ?? "",
        ),
      )
      .slice(0, 10)
      .map((e) => ({ e, job: appToJob.get(e.application_id) }));
  }, [events, applications, jobById]);

  return (
    <AppShell title="Dashboard" subtitle="What needs your attention right now">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface px-4 py-3.5">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div
              className={cn(
                "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
                k.tone,
              )}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Action Needed</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {actions.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Nothing urgent. Nice.
              </p>
            )}
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => setOpenJob(a.jobId)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                >
                  <Icon className={cn("size-4 shrink-0", a.tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{a.company}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {a.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.reason}</div>
                  </div>
                  <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {a.action}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Recent Activity</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {recent.map(({ e, job }) => (
              <button
                key={e.id}
                onClick={() => job && setOpenJob(job.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <span className="num w-20 shrink-0 pt-0.5 text-muted-foreground">
                  {relativeDay(e.received_at ?? e.event_date) ||
                    fmtLong(e.received_at ?? e.event_date)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{job?.company ?? "—"}</span>{" "}
                    <span className="text-muted-foreground">— {e.event_type}</span>
                  </div>
                  {e.event_date && e.received_at && e.event_date !== e.received_at && (
                    <div className="num text-muted-foreground">
                      scheduled {fmtLong(e.event_date)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {applications.map((a) => {
            const job = jobById.get(a.job_id);
            if (!job) return null;
            return (
              <button
                key={a.id}
                onClick={() => setOpenJob(job.id)}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:bg-accent/50"
              >
                <span className="text-sm font-medium">{job.company}</span>
                <StatusBadge state={a.workflow_state} />
              </button>
            );
          })}
        </div>
      </section>

      <JobDrawer jobId={openJob} onOpenChange={(o) => !o && setOpenJob(null)} />
    </AppShell>
  );
}
