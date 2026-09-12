"use client";

import { useMemo } from "react";
import ClientOnly from "@/components/ClientOnly";
import ClassChip, { classColor } from "@/components/ClassChip";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { classByKey } from "@/lib/seedData";
import { addDaysISO, compareISO, monthDayLabel, todayISO } from "@/lib/dateUtils";
import { ClassKey } from "@/lib/types";

function UpcomingContent() {
  const { assignments, blocks, couldntFit } = useSchedule();
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);

  const horizon = addDaysISO(todayISO(), 14);
  const scheduledIds = useMemo(() => new Set(blocks.map((b) => b.assignmentId)), [blocks]);
  const couldntFitIds = useMemo(() => new Set(couldntFit.map((c) => c.assignmentId)), [couldntFit]);

  const upcoming = useMemo(
    () =>
      assignments
        .filter((a) => compareISO(a.dueDate, todayISO()) >= 0 && compareISO(a.dueDate, horizon) <= 0)
        .sort((a, b) => compareISO(a.dueDate, b.dueDate)),
    [assignments, horizon]
  );

  const grouped = useMemo(() => {
    const map = new Map<ClassKey, typeof upcoming>();
    for (const a of upcoming) {
      if (!map.has(a.classKey)) map.set(a.classKey, []);
      map.get(a.classKey)!.push(a);
    }
    return Array.from(map.entries()).sort(
      (a, b) => (classByKey[a[0]]?.priority ?? 2) - (classByKey[b[0]]?.priority ?? 2)
    );
  }, [upcoming]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-semibold">Next 14 Days</h1>
      {grouped.length === 0 && <p className="text-sm text-muted py-8 text-center">Nothing due soon.</p>}
      {grouped.map(([classKey, items]) => (
        <div key={classKey} className="space-y-2">
          <div className="flex items-center gap-2">
            <ClassChip classKey={classKey} color={classColor(classKey, colorOverrides)} />
          </div>
          <div className="space-y-1.5">
            {items.map((a) => {
              const status = a.inClass ? "in class" : scheduledIds.has(a.id) ? "scheduled" : couldntFitIds.has(a.id) ? "not yet scheduled" : "scheduled";
              const statusColor =
                status === "in class" ? "text-muted" : status === "scheduled" ? "text-good" : "text-warn";
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface border border-border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{a.title}</p>
                    <p className="text-xs text-muted">
                      Due {monthDayLabel(a.dueDate)}
                      {a.deadlineDate && ` · Deadline ${monthDayLabel(a.deadlineDate)}`}
                    </p>
                  </div>
                  <span className={`text-xs shrink-0 ${statusColor}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UpcomingPage() {
  return (
    <ClientOnly>
      <UpcomingContent />
    </ClientOnly>
  );
}
