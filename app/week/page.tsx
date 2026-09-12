"use client";

import { useMemo, useState } from "react";
import ClientOnly from "@/components/ClientOnly";
import BlockCard from "@/components/BlockCard";
import ClassChip, { classColor } from "@/components/ClassChip";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { addDaysISO, todayISO, weekdayShort, monthDayLabel, isTodayISO } from "@/lib/dateUtils";
import { Feedback } from "@/lib/types";

function WeekContent() {
  const { assignments, assignmentsById, blocks, doneBlocks } = useSchedule();
  const markDone = useHomeworkStore((s) => s.markDone);
  const unmarkDone = useHomeworkStore((s) => s.unmarkDone);
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);

  const days = useMemo(() => {
    const today = todayISO();
    return Array.from({ length: 7 }, (_, i) => addDaysISO(today, i));
  }, []);
  const [openDay, setOpenDay] = useState(days[0]);

  function toggle(blockId: string, date: string, index: number, minutes: number, assignmentId: string) {
    const assignment = assignmentsById.get(assignmentId);
    if (!assignment) return;
    if (doneBlocks[blockId]) unmarkDone(blockId);
    else markDone(blockId, assignmentId, index, date, minutes, assignment.classKey, assignment.workType, null);
  }

  function feedback(blockId: string, date: string, index: number, minutes: number, assignmentId: string, fb: Feedback) {
    const assignment = assignmentsById.get(assignmentId);
    if (!assignment) return;
    markDone(blockId, assignmentId, index, date, minutes, assignment.classKey, assignment.workType, fb);
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-3">
      <h1 className="text-xl font-semibold">This Week</h1>
      {days.map((day) => {
        const dayBlocks = blocks.filter((b) => b.date === day);
        const pinned = assignments.filter(
          (a) => a.dueDate === day && (a.urgency === "test" || a.urgency === "quiz")
        );
        const open = openDay === day;
        return (
          <div key={day} className="rounded-xl border border-border bg-surface overflow-hidden">
            <button
              onClick={() => setOpenDay(open ? "" : day)}
              className="w-full flex items-center justify-between px-3 py-2.5"
            >
              <span className={`text-sm font-medium ${isTodayISO(day) ? "text-accent" : ""}`}>
                {weekdayShort(day)} {monthDayLabel(day)}
                {isTodayISO(day) && " · Today"}
              </span>
              <span className="text-xs text-muted">
                {dayBlocks.length} block{dayBlocks.length === 1 ? "" : "s"} {open ? "▲" : "▼"}
              </span>
            </button>

            {pinned.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {pinned.map((a) => (
                  <span
                    key={a.id}
                    className="text-xs rounded-full px-2 py-1 font-medium"
                    style={{ backgroundColor: `${classColor(a.classKey, colorOverrides)}22`, color: classColor(a.classKey, colorOverrides) }}
                  >
                    {a.urgency === "test" ? "🧪" : "📝"} {a.title}
                  </span>
                ))}
              </div>
            )}

            {open && (
              <div className="px-3 pb-3 space-y-2">
                {dayBlocks.length === 0 && <p className="text-xs text-muted py-2">Nothing scheduled.</p>}
                {dayBlocks.map((block) => {
                  const assignment = assignmentsById.get(block.assignmentId);
                  if (!assignment) return null;
                  const rec = doneBlocks[block.id];
                  return (
                    <BlockCard
                      key={block.id}
                      block={block}
                      assignment={assignment}
                      done={!!rec}
                      feedback={rec?.feedback ?? null}
                      colorOverrides={colorOverrides}
                      onToggleDone={() => toggle(block.id, block.date, block.index, block.minutes, block.assignmentId)}
                      onFeedback={(fb) => feedback(block.id, block.date, block.index, block.minutes, block.assignmentId, fb)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WeekPage() {
  return (
    <ClientOnly>
      <WeekContent />
    </ClientOnly>
  );
}
