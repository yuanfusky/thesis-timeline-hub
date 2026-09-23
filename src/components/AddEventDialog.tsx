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
import { useStore } from "@/lib/store";
import { EVENT_STATE_MAP, EVENT_TYPES, eventDateFields, type EventType } from "@/lib/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function AddEventDialog({ applicationId }: { applicationId: string }) {
  const { addEvent } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EventType>("Application Submitted");
  const [received, setReceived] = useState(todayStr());
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");

  const fields = eventDateFields(type);
  const nextState = EVENT_STATE_MAP[type];

  const submit = () => {
    addEvent(applicationId, {
      event_type: type,
      received_at: fields.received ? received || null : null,
      event_date: fields.event ? eventDate || null : null,
      notes,
    });
    toast.success(`${type} added`);
    setNotes("");
    setEventDate("");
    setReceived(todayStr());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="size-3.5" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>
            Events build the application timeline and keep the current status in sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Event Type
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.received && (
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {fields.received}
                </Label>
                <Input
                  type="date"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                />
              </div>
            )}
            {fields.event && (
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {fields.event}
                </Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Notes
            </Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {nextState && (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Status will be set to <span className="font-medium text-foreground">{nextState}</span>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
