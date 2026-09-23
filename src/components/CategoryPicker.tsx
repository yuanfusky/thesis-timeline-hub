import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  all,
  selected,
  onChange,
  onCreate,
}: {
  all: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const toggle = (c: string) =>
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);

  const create = () => {
    const clean = draft.trim();
    if (!clean) return;
    onCreate(clean);
    if (!selected.includes(clean)) onChange([...selected, clean]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium"
          >
            {c}
            <button
              type="button"
              onClick={() => toggle(c)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${c}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 rounded-full px-2.5 text-xs">
              <Plus className="size-3" /> Category
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <div className="flex gap-1.5 pb-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    create();
                  }
                }}
                placeholder="New category…"
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" className="h-8" onClick={create}>
                Add
              </Button>
            </div>
            <ScrollArea className="h-56">
              <div className="space-y-0.5 pr-2">
                {all.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent",
                      selected.includes(c) && "font-medium",
                    )}
                  >
                    {c}
                    {selected.includes(c) && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
