"use client";

import { useMemo, useState } from "react";
import ClientOnly from "@/components/ClientOnly";
import BlockCard from "@/components/BlockCard";
import ClassChip, { classColor } from "@/components/ClassChip";
import Collapse from "@/components/Collapse";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { addDaysISO, todayISO, weekdayShort, monthDayLabel, isTodayISO } from "@/lib/dateUtils";
import { Feedback } from "@/lib/types";
import { groupBlocksByAssignment, pinnedEventTitle } from "@/lib/blockLabel";
import { IconChevronDown, IconTarget, IconFlask2 } from "@tabler/icons-react";

function WeekContent() {
  const { assignments, assignmentsById, blocks, doneBlocks } = useSchedule();
  const markDone = useHomeworkStore((s) => s.markDone);
  const unmarkDone = useHomeworkStore((s) => s.unmarkDone);
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);
  const blockGroups = useMemo(() => groupBlocksByAssignment(blocks), [blocks]);

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
      <h1 className="text-[22px] font-medium text-text">This Week</h1>
      {days.map((day) => {
        const dayBlocks = blocks.filter((b) => b.date === day);
        const pinned = assignments.filter(
          (a) => a.dueDate === day && (a.urgency === "test" || a.urgency === "quiz")
        );
        const open = openDay === day;
        return (
          <div
            key={day}
            className="rounded-xl border border-border bg-surface overflow-hidden transition-colors hover:border-[#3a3a3a]"
          >
            <button
              onClick={() => setOpenDay(open ? "" : day)}
              className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-surface2 active:bg-surface2"
            >
              <span className={`text-sm font-medium ${isTodayISO(day) ? "text-accent" : "text-text"}`}>
                {weekdayShort(day)} {monthDayLabel(day)}
                {isTodayISO(day) && " · Today"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                {dayBlocks.length} block{dayBlocks.length === 1 ? "" : "s"}
                <IconChevronDown size={15} className={`chevron ${open ? "chevron-open" : ""}`} />
              </span>
            </button>

            {pinned.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {pinned.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 font-medium"
                    style={{ backgroundColor: `${classColor(a.classKey, colorOverrides)}22`, color: classColor(a.classKey, colorOverrides) }}
                  >
                    {a.urgency === "test" ? <IconFlask2 size={13} /> : <IconTarget size={13} />}
                    {pinnedEventTitle(a)}
                  </span>
                ))}
              </div>
            )}

            <Collapse open={open}>
              <div className="px-3 pb-3 space-y-2">
                {dayBlocks.length === 0 && <p className="text-xs text-muted py-2">Nothing scheduled.</p>}
                {dayBlocks.map((block) => {
                  const assignment = assignmentsById.get(block.assignmentId);
                  const group = blockGroups.get(block.id);
                  if (!assignment || !group) return null;
                  const rec = doneBlocks[block.id];
                  return (
                    <BlockCard
                      key={block.id}
                      block={block}
                      assignment={assignment}
                      group={group}
                      done={!!rec}
                      feedback={rec?.feedback ?? null}
                      colorOverrides={colorOverrides}
                      onToggleDone={() => toggle(block.id, block.date, block.index, block.minutes, block.assignmentId)}
                      onFeedback={(fb) => feedback(block.id, block.date, block.index, block.minutes, block.assignmentId, fb)}
                    />
                  );
                })}
              </div>
            </Collapse>
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
