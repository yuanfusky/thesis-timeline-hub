import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";


import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddEventDialog } from "@/components/AddEventDialog";
import { CategoryPicker } from "@/components/CategoryPicker";
import { SuggestInput } from "@/components/SuggestInput";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/Timeline";
import { CategoryTag, PriorityTag, StatusBadge } from "@/components/StatusBadge";
import { fmtLong, relativeDay } from "@/lib/dates";
import { useStore } from "@/lib/store";
import {
  PRIORITIES,
  WORKFLOW_STATES,
  type Priority,
  type WorkflowState,
} from "@/lib/types";

export function JobDrawer({
  jobId,
  onOpenChange,
}: {
  jobId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    jobs,
    categories,
    applicationForJob,
    eventsFor,
    updateApplication,
    updateJob,
    addCategory,
    deleteJob,
    deleteEvent,
  } = useStore();
  const companyOptions = jobs.map((j) => j.company);
  const locationOptions = jobs.map((j) => j.location);
  const job = jobs.find((j) => j.id === jobId);
  const application = job ? applicationForJob(job.id) : undefined;

  return (
    <Sheet open={!!jobId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {job && application && (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-3 pr-7">

                <div className="min-w-0">
                  <SheetDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {job.company} · {job.location || "—"}
                  </SheetDescription>
                  <SheetTitle className="mt-1 text-lg leading-snug">{job.title}</SheetTitle>
                </div>
                <StatusBadge state={application.workflow_state} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {job.categories.map((c) => (
                  <CategoryTag key={c} label={c} />
                ))}
                <span className="ml-1">
                  <PriorityTag priority={job.priority} />
                </span>
              </div>
              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-status-toapply hover:underline"
                >
                  Open application page <ExternalLink className="size-3.5" />
                </a>
              )}
            </SheetHeader>

            <div className="grid grid-cols-3 border-b border-border">
              <DateCell label="Released" value={job.release_date} />
              <DateCell label="Deadline" value={job.deadline} highlight />
              <DateCell label="Applied" value={application.applied_at} last />
            </div>

            <div className="space-y-6 px-6 py-5">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Application URL
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://…"
                    value={job.application_url}
                    onChange={(e) =>
                      updateJob(job.id, { application_url: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Job Title
                  </Label>
                  <Input
                    value={job.title}
                    onChange={(e) => updateJob(job.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Company
                  </Label>
                  <SuggestInput
                    value={job.company}
                    options={companyOptions}
                    placeholder="Company"
                    onChange={(v) => updateJob(job.id, { company: v })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Location
                  </Label>
                  <SuggestInput
                    value={job.location}
                    options={locationOptions}
                    placeholder="City / remote"
                    onChange={(v) => updateJob(job.id, { location: v })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Release Date
                  </Label>
                  <Input
                    type="date"
                    value={job.release_date ?? ""}
                    onChange={(e) =>
                      updateJob(job.id, { release_date: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Deadline
                  </Label>
                  <Input
                    type="date"
                    value={job.deadline ?? ""}
                    onChange={(e) =>
                      updateJob(job.id, { deadline: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Applied Date
                  </Label>
                  <Input
                    type="date"
                    value={application.applied_at ?? ""}
                    onChange={(e) =>
                      updateApplication(application.id, {
                        applied_at: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Current Status
                  </Label>
                  <Select
                    value={application.workflow_state}
                    onValueChange={(v) =>
                      updateApplication(application.id, {
                        workflow_state: v as WorkflowState,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Next Action Date
                  </Label>
                  <Input
                    type="date"
                    value={application.next_action_date ?? ""}
                    onChange={(e) =>
                      updateApplication(application.id, {
                        next_action_date: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Next Action
                  </Label>
                  <Input
                    value={application.next_action}
                    placeholder="What needs to happen next?"
                    onChange={(e) =>
                      updateApplication(application.id, { next_action: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={job.priority}
                    onValueChange={(v) => updateJob(job.id, { priority: v as Priority })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Categories
                  </Label>
                  <CategoryPicker
                    all={categories}
                    selected={job.categories}
                    onChange={(next) => updateJob(job.id, { categories: next })}
                    onCreate={addCategory}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Application Timeline</h3>
                  <AddEventDialog applicationId={application.id} />
                </div>
                <Timeline
                  events={eventsFor(application.id)}
                  onDelete={(id) => {
                    deleteEvent(id);
                    toast.success("Event deleted");
                  }}
                />
              </section>

              <section>
                <h3 className="mb-1.5 text-sm font-semibold">Notes</h3>
                <Textarea
                  rows={3}
                  value={job.notes}
                  placeholder="Contact person, requirements, thoughts…"
                  onChange={(e) => updateJob(job.id, { notes: e.target.value })}
                />
              </section>

              <section>
                <h3 className="mb-1.5 text-sm font-semibold">Job Description</h3>
                <Textarea
                  rows={5}
                  value={job.job_description}
                  placeholder="Paste the job description here…"
                  onChange={(e) => updateJob(job.id, { job_description: e.target.value })}
                />
              </section>

              <section className="border-t border-border pt-5">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Delete job
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {job.title} at {job.company} and its whole application timeline
                        will be removed. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          deleteJob(job.id);
                          onOpenChange(false);
                          toast.success("Job deleted");
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DateCell({
  label,
  value,
  highlight,
  last,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`px-6 py-3 ${last ? "" : "border-r border-border"}`}>
      <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="num mt-0.5 text-foreground">{fmtLong(value)}</div>
      {highlight && value && (
        <div className="text-[11px] text-muted-foreground">{relativeDay(value)}</div>
      )}
    </div>
  );
}
