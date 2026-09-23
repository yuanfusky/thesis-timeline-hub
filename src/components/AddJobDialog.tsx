import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useStore } from "@/lib/store";
import { PRIORITIES, type Priority } from "@/lib/types";

const empty = {
  title: "",
  company: "",
  location: "",
  application_url: "",
  release_date: "",
  deadline: "",
  notes: "",
  job_description: "",
};

export function AddJobDialog() {
  const { categories, addJob, addCategory } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [initial, setInitial] = useState<"Saved" | "To Apply">("Saved");

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Job title and company are required.");
      return;
    }
    addJob({
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      application_url: form.application_url.trim(),
      release_date: form.release_date || null,
      deadline: form.deadline || null,
      categories: selected,
      priority,
      notes: form.notes,
      job_description: form.job_description,
      initial_state: initial,
    });
    toast.success(`${form.company.trim()} added`);
    setForm(empty);
    setSelected([]);
    setPriority("Medium");
    setInitial("Saved");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add job</DialogTitle>
          <DialogDescription>
            Track a new thesis opportunity. An application and its timeline are created
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job Title" className="sm:col-span-2">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Machine Learning for Autonomous Systems"
            />
          </Field>
          <Field label="Company">
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Volvo Group"
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Göteborg"
            />
          </Field>
          <Field label="Application URL" className="sm:col-span-2">
            <Input
              value={form.application_url}
              onChange={(e) => set("application_url", e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Release Date">
            <Input
              type="date"
              value={form.release_date}
              onChange={(e) => set("release_date", e.target.value)}
            />
          </Field>
          <Field label="Deadline">
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
          <Field label="Categories" className="sm:col-span-2">
            <CategoryPicker
              all={categories}
              selected={selected}
              onChange={setSelected}
              onCreate={addCategory}
            />
          </Field>
          <Field label="Priority">
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
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
          </Field>
          <Field label="Initial state">
            <Select
              value={initial}
              onValueChange={(v) => setInitial(v as "Saved" | "To Apply")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Saved">Saved</SelectItem>
                <SelectItem value="To Apply">To Apply</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Contact person, requirements, thoughts…"
            />
          </Field>
          <Field label="Job Description" className="sm:col-span-2">
            <Textarea
              value={form.job_description}
              onChange={(e) => set("job_description", e.target.value)}
              rows={4}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
