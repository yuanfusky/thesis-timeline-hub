import { useEffect, useState } from "react";
import { CloudUpload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LEGACY_STORAGE_KEY, useStore } from "@/lib/store";

export function MigrateLocalBanner() {
  const { ready, legacyLocalCount, migrateLegacyLocalData } = useStore();
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(`${LEGACY_STORAGE_KEY}.migrated`)) return;
    setCount(legacyLocalCount());
  }, [legacyLocalCount]);

  if (!ready || dismissed || count === 0) return null;

  const run = async () => {
    setBusy(true);
    try {
      const result = await migrateLegacyLocalData();
      toast.success(
        `Moved ${result.jobs} jobs and ${result.events} timeline entries to the cloud`,
      );
      setDismissed(true);
    } catch {
      toast.error("Could not move your local data. Try Export, then Import.");
    }
    setBusy(false);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-accent/40 px-4 py-3">
      <CloudUpload className="size-4 text-muted-foreground" />
      <p className="min-w-0 flex-1 text-sm">
        Found {count} jobs saved in this browser. Copy them to your account so they sync
        everywhere.
      </p>
      <Button size="sm" onClick={run} disabled={busy}>
        {busy ? "Copying…" : "Copy to my account"}
      </Button>
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
