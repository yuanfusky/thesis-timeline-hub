import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays, parseISO } from "date-fns";

import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { RESPONSE_EVENTS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Master Thesis Tracker" },
      {
        name: "description",
        content:
          "Application funnel, applications by category, interview rate and average time to first response across thesis applications.",
      },
      { property: "og:title", content: "Analytics — Master Thesis Tracker" },
      {
        property: "og:description",
        content:
          "Application funnel, applications by category, interview rate and average time to first response across thesis applications.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const INTERVIEWED = new Set(["Interview", "Offer"]);

function AnalyticsPage() {
  const { jobs, applications, events } = useStore();

  const data = useMemo(() => {
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const eventsByApp = new Map<string, typeof events>();
    for (const e of events) {
      const list = eventsByApp.get(e.application_id) ?? [];
      list.push(e);
      eventsByApp.set(e.application_id, list);
    }

    const hasType = (appId: string, types: string[]) =>
      (eventsByApp.get(appId) ?? []).some((e) => types.includes(e.event_type));

    const applied = applications.filter(
      (a) => a.applied_at || hasType(a.id, ["Application Submitted"]),
    );
    const interviewed = applications.filter(
      (a) =>
        INTERVIEWED.has(a.workflow_state) ||
        hasType(a.id, [
          "Interview Invitation",
          "Interview Round 1",
          "Interview Round 2",
          "Technical Interview",
          "HR Interview",
        ]),
    );
    const offers = applications.filter(
      (a) => a.workflow_state === "Offer" || hasType(a.id, ["Offer Received"]),
    );

    const funnel = [
      { label: "Tracked", value: jobs.length, tone: "bg-status-saved" },
      { label: "Applied", value: applied.length, tone: "bg-status-applied" },
      { label: "Interview", value: interviewed.length, tone: "bg-status-interview" },
      { label: "Offer", value: offers.length, tone: "bg-status-offer" },
    ];

    const byCategory = new Map<string, { total: number; interview: number }>();
    for (const a of applications) {
      const job = jobById.get(a.job_id);
      if (!job) continue;
      const didInterview = interviewed.includes(a);
      for (const c of job.categories) {
        const row = byCategory.get(c) ?? { total: 0, interview: 0 };
        row.total += 1;
        if (didInterview) row.interview += 1;
        byCategory.set(c, row);
      }
    }
    const categoryRows = [...byCategory.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

    const responseDays: number[] = [];
    for (const a of applications) {
      if (!a.applied_at) continue;
      const first = (eventsByApp.get(a.id) ?? [])
        .filter((e) => RESPONSE_EVENTS.includes(e.event_type) && e.received_at)
        .sort((x, y) => (x.received_at! < y.received_at! ? -1 : 1))[0];
      if (!first?.received_at) continue;
      const d = differenceInCalendarDays(
        parseISO(first.received_at),
        parseISO(a.applied_at),
      );
      if (d >= 0) responseDays.push(d);
    }
    const avgResponse =
      responseDays.length > 0
        ? Math.round(responseDays.reduce((s, x) => s + x, 0) / responseDays.length)
        : null;

    return {
      funnel,
      categoryRows,
      avgResponse,
      responseCount: responseDays.length,
      appliedCount: applied.length,
      interviewRate:
        applied.length > 0 ? Math.round((interviewed.length / applied.length) * 100) : 0,
    };
  }, [jobs, applications, events]);

  const maxFunnel = Math.max(...data.funnel.map((f) => f.value), 1);
  const maxCat = Math.max(...data.categoryRows.map((c) => c.total), 1);

  return (
    <AppShell title="Analytics" subtitle="How the search is actually going">
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <Stat label="Applications sent" value={String(data.appliedCount)} />
        <Stat label="Interview rate" value={`${data.interviewRate}%`} />
        <Stat
          label="Avg. time to first response"
          value={data.avgResponse === null ? "—" : `${data.avgResponse} days`}
          hint={`${data.responseCount} response${data.responseCount === 1 ? "" : "s"} measured`}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Application Funnel</h2>
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            {data.funnel.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="font-medium">{f.label}</span>
                  <span className="num text-muted-foreground">{f.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", f.tone)}
                    style={{ width: `${(f.value / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Applications by Category</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Jobs</th>
                  <th className="px-3 py-2 font-medium">Interview rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.categoryRows.map((c) => (
                  <tr key={c.label}>
                    <td className="px-3 py-2">{c.label}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-status-applied"
                            style={{ width: `${(c.total / maxCat) * 100}%` }}
                          />
                        </div>
                        <span className="num text-muted-foreground">{c.total}</span>
                      </div>
                    </td>
                    <td className="num px-3 py-2 text-muted-foreground">
                      {c.total > 0 ? `${Math.round((c.interview / c.total) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
                {data.categoryRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center text-xs text-muted-foreground">
                      No categories yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
