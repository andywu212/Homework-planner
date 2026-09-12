"use client";

import { useRef } from "react";
import ClientOnly from "@/components/ClientOnly";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { classes as allClasses } from "@/lib/seedData";
import { TimeWindow } from "@/lib/types";

function WindowEditor({
  label,
  windows,
  onChange,
}: {
  label: string;
  windows: TimeWindow[];
  onChange: (next: TimeWindow[]) => void;
}) {
  function update(i: number, field: "start" | "end", value: string) {
    const next = windows.map((w, idx) => (idx === i ? { ...w, [field]: value } : w));
    onChange(next);
  }
  function remove(i: number) {
    onChange(windows.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...windows, { start: "16:00", end: "17:00" }]);
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{label}</h3>
      {windows.map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="time"
            value={w.start}
            onChange={(e) => update(i, "start", e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm flex-1"
          />
          <span className="text-muted text-xs">to</span>
          <input
            type="time"
            value={w.end}
            onChange={(e) => update(i, "end", e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm flex-1"
          />
          <button onClick={() => remove(i)} className="text-bad text-xs px-2">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add} className="text-xs text-accent">
        + Add window
      </button>
    </div>
  );
}

function SettingsContent() {
  const settings = useHomeworkStore((s) => s.settings);
  const updateSettings = useHomeworkStore((s) => s.updateSettings);
  const toggleHiddenClass = useHomeworkStore((s) => s.toggleHiddenClass);
  const setClassColor = useHomeworkStore((s) => s.setClassColor);
  const resetMultipliers = useHomeworkStore((s) => s.resetMultipliers);
  const exportData = useHomeworkStore((s) => s.exportData);
  const importData = useHomeworkStore((s) => s.importData);
  const { refresh, syncing, lastSynced } = useSchedule();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homework-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importData(data);
        alert("Backup restored.");
      } catch {
        alert("That file doesn't look like a valid backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Sync</h2>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
          <p className="text-xs text-muted">
            {lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString()}` : "Not synced yet"}
          </p>
          <button
            onClick={refresh}
            disabled={syncing}
            className="text-sm rounded-lg bg-accent text-white px-3 py-1.5 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Refresh now"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Available time</h2>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-4">
          <WindowEditor
            label="School days"
            windows={settings.schoolWindows}
            onChange={(w) => updateSettings({ schoolWindows: w })}
          />
          <WindowEditor
            label="Weekends & no-school days"
            windows={settings.weekendWindows}
            onChange={(w) => updateSettings({ weekendWindows: w })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Classes</h2>
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {allClasses.map((c) => {
            const hidden = settings.hiddenClasses.includes(c.key);
            const color = settings.classColorOverrides[c.key] ?? c.color;
            return (
              <div key={c.key} className="flex items-center gap-3 px-3 py-2.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setClassColor(c.key, e.target.value)}
                  className="h-7 w-7 rounded border border-border bg-transparent"
                />
                <span className={`flex-1 text-sm ${hidden ? "text-muted line-through" : ""}`}>{c.name}</span>
                <button
                  onClick={() => toggleHiddenClass(c.key)}
                  className="text-xs rounded-full border border-border px-2 py-1 text-muted"
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Time estimates</h2>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
          <p className="text-xs text-muted">
            The app learns your pace per class + assignment type from the &quot;how&apos;d it go&quot; buttons.
          </p>
          <button onClick={resetMultipliers} className="text-xs rounded-full border border-border px-2.5 py-1">
            Reset learned estimates
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Calc BC schedule</h2>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
          <p className="text-xs text-muted">
            The Calc BC schedule isn&apos;t in Canvas — it&apos;s transcribed from the teacher&apos;s PDF into{" "}
            <code className="text-accent">seed_data.json</code>. When you get an updated PDF, send it back through
            Claude Code to re-transcribe that file and redeploy — that&apos;s the whole update.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Backup</h2>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
          <p className="text-xs text-muted">
            Your done-history lives in this browser only. Export a backup occasionally so clearing your browser
            doesn&apos;t erase your streak.
          </p>
          <div className="flex gap-2">
            <button onClick={handleExport} className="text-sm rounded-lg border border-border px-3 py-1.5">
              Export backup
            </button>
            <button onClick={handleImportClick} className="text-sm rounded-lg border border-border px-3 py-1.5">
              Restore backup
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsContent />
    </ClientOnly>
  );
}
