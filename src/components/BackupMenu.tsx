import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function BackupMenu() {
  const { exportData, importData } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thesis-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const handleFile = async (file: File) => {
    try {
      const result = importData(await file.text());
      toast.success(
        `Imported ${result.jobs} jobs, ${result.events} timeline entries`,
      );
    } catch {
      toast.error("That file could not be read as a backup");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex gap-1.5 px-3 pb-3">
      <Button
        variant="outline"
        size="sm"
        className="h-8 flex-1 gap-1.5 text-xs"
        onClick={handleExport}
      >
        <Download className="size-3.5" />
        Export
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 flex-1 gap-1.5 text-xs"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-3.5" />
        Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
