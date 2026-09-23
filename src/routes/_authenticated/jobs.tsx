import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Check, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { JobDrawer } from "@/components/JobDrawer";
import { CategoryTag, PriorityTag, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmt, relativeDay } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PRIORITIES, type WorkflowState } from "@/lib/types";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — Master Thesis Tracker" },
      {
        name: "description",
        content:
          "Search, filter and sort every tracked master thesis position, with status, deadlines and next actions in one compact table.",
      },
      { property: "og:title", content: "Jobs — Master Thesis Tracker" },
      {
        property: "og:description",
        content:
          "Search, filter and sort every tracked master thesis position, with status, deadlines and next actions in one compact table.",
      },
    ],
  }),
  component: JobsPage,
});

const TABS: ("All" | WorkflowState)[] = [
  "All",
  "Saved",
  "To Apply",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

type SortKey = "company" | "deadline" | "release" | "applied" | "priority";

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

function JobsPage() {
  const { jobs, applications, categories, deleteJobs, assignCategories } = useStore();
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("all");
  const [location, setLocation] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [asc, setAsc] = useState(true);

  const appByJob = useMemo(
    () => new Map(applications.map((a) => [a.job_id, a])),
    [applications],
  );

  const companies = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.company))).sort(),
    [jobs],
  );
  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort(),
    [jobs],
  );
  const usedCategories = useMemo(
    () => categories.filter((c) => jobs.some((j) => j.categories.includes(c))),
    [categories, jobs],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = jobs
      .map((job) => ({ job, app: appByJob.get(job.id) }))
      .filter(({ job, app }) => {
        if (!app) return false;
        if (tab !== "All" && app.workflow_state !== tab) return false;
        if (company !== "all" && job.company !== company) return false;
        if (location !== "all" && job.location !== location) return false;
        if (category !== "all" && !job.categories.includes(category)) return false;
        if (priority !== "all" && job.priority !== priority) return false;
        if (
          term &&
          ![job.title, job.company, job.location, job.notes, ...job.categories]
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
          return false;
        return true;
      });

    const val = ({ job, app }: (typeof list)[number]) => {
      switch (sort) {
        case "company":
          return job.company.toLowerCase();
        case "release":
          return job.release_date ?? "9999";
        case "applied":
          return app?.applied_at ?? "9999";
        case "priority":
          return String(PRIORITY_ORDER[job.priority]);
        default:
          return job.deadline ?? "9999";
      }
    };
    return list.sort((a, b) => (val(a) < val(b) ? (asc ? -1 : 1) : val(a) > val(b) ? (asc ? 1 : -1) : 0));
  }, [jobs, appByJob, tab, q, company, location, category, priority, sort, asc]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: applications.length };
    for (const a of applications)
      m[a.workflow_state] = (m[a.workflow_state] ?? 0) + 1;
    return m;
  }, [applications]);

  const allSelected = rows.length > 0 && rows.every(({ job }) => selected.includes(job.id));
  const someSelected = selected.length > 0 && !allSelected;

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(true);
    }
  };

  return (
    <AppShell title="Jobs" subtitle={`${rows.length} of ${jobs.length} positions`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              tab === t
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, title, category…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <FilterSelect value={company} onChange={setCompany} label="Company" options={companies} />
        <FilterSelect value={location} onChange={setLocation} label="Location" options={locations} />
        <FilterSelect
          value={category}
          onChange={setCategory}
          label="Category"
          options={usedCategories}
        />
        <FilterSelect
          value={priority}
          onChange={setPriority}
          label="Priority"
          options={[...PRIORITIES]}
        />
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2">
          <span className="text-xs font-medium">{selected.length} selected</span>
          <div className="flex-1" />
          <BulkCategoryMenu
            all={categories}
            onApply={(cats, mode) => {
              assignCategories(selected, cats, mode);
              toast.success(
                mode === "replace"
                  ? `Categories set for ${selected.length} jobs`
                  : `Categories added to ${selected.length} jobs`,
              );
              setSelected([]);
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive">
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.length} jobs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the selected positions and their full event timelines. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteJobs(selected);
                    toast.success(`${selected.length} jobs deleted`);
                    setSelected([]);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelected([])}
          >
            <X className="size-3.5" /> Clear
          </Button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
              <th className="w-9 px-3 py-2">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) =>
                    setSelected(v ? rows.map(({ job }) => job.id) : [])
                  }
                  aria-label="Select all"
                />
              </th>
              <Th onClick={() => toggleSort("company")}>Company</Th>
              <Th>Job Title</Th>
              <Th>Category</Th>
              <Th>Location</Th>
              <Th onClick={() => toggleSort("release")}>Released</Th>
              <Th onClick={() => toggleSort("deadline")}>Deadline</Th>
              <Th onClick={() => toggleSort("applied")}>Applied</Th>
              <Th>Status</Th>
              <Th onClick={() => toggleSort("priority")}>Priority</Th>
              <Th>Next Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ job, app }) => (
              <tr
                key={job.id}
                onClick={() => setOpenJob(job.id)}
                className="cursor-pointer transition-colors hover:bg-accent/50"
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.includes(job.id)}
                    onCheckedChange={(v) =>
                      setSelected((s) =>
                        v ? [...s, job.id] : s.filter((id) => id !== job.id),
                      )
                    }
                    aria-label={`Select ${job.title}`}
                  />
                </td>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">{job.company}</td>
                <td className="max-w-64 truncate px-3 py-2.5">{job.title}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    {job.categories.slice(0, 2).map((c) => (
                      <CategoryTag key={c} label={c} />
                    ))}
                    {job.categories.length > 2 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{job.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                  {job.location || "—"}
                </td>
                <td className="num px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                  {fmt(job.release_date)}
                </td>
                <td className="num px-3 py-2.5 whitespace-nowrap">
                  {fmt(job.deadline)}
                  {job.deadline && !app?.applied_at && (
                    <span className="ml-1.5 text-[11px] text-muted-foreground">
                      {relativeDay(job.deadline)}
                    </span>
                  )}
                </td>
                <td className="num px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                  {fmt(app?.applied_at ?? null)}
                </td>
                <td className="px-3 py-2.5">
                  {app && <StatusBadge state={app.workflow_state} />}
                </td>
                <td className="px-3 py-2.5">
                  <PriorityTag priority={job.priority} />
                </td>
                <td className="max-w-56 truncate px-3 py-2.5 text-xs text-muted-foreground">
                  {app?.next_action || "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center text-xs text-muted-foreground">
                  No jobs match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <JobDrawer jobId={openJob} onOpenChange={(o) => !o && setOpenJob(null)} />
    </AppShell>
  );
}

function Th({
  children,
  onClick,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <th className="px-3 py-2 font-medium">
      {onClick ? (
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
        >
          {children}
          <ArrowUpDown className="size-3 opacity-50" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-28 text-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BulkCategoryMenu({
  all,
  onApply,
}: {
  all: string[];
  onApply: (categories: string[], mode: "add" | "replace") => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const toggle = (c: string) =>
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const apply = (mode: "add" | "replace") => {
    if (picked.length === 0) return;
    onApply(picked, mode);
    setPicked([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Plus className="size-3.5" /> Category
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="flex gap-1.5 pb-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const clean = draft.trim();
                if (!clean) return;
                setPicked((p) => (p.includes(clean) ? p : [...p, clean]));
                setDraft("");
              }
            }}
            placeholder="New category…"
            className="h-8 text-xs"
          />
        </div>
        <ScrollArea className="h-52">
          <div className="space-y-0.5 pr-2">
            {Array.from(new Set([...picked, ...all])).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent",
                  picked.includes(c) && "font-medium",
                )}
              >
                {c}
                {picked.includes(c) && <Check className="size-3.5" />}
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
          <Button
            size="sm"
            className="h-7 flex-1 text-xs"
            disabled={picked.length === 0}
            onClick={() => apply("add")}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-xs"
            disabled={picked.length === 0}
            onClick={() => apply("replace")}
          >
            Replace
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
