"use client";

import { useMemo, useState } from "react";
import ClientOnly from "@/components/ClientOnly";
import BlockCard from "@/components/BlockCard";
import ClassChip, { classColor } from "@/components/ClassChip";
import SakuraHeader from "@/components/SakuraHeader";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import {
  buildMonthGrid,
  isTodayISO,
  isoToDate,
  monthDayLabel,
  monthYearLabel,
  todayISO,
} from "@/lib/dateUtils";
import { Feedback, ClassKey } from "@/lib/types";
import { groupBlocksByAssignment, pinnedEventTitle } from "@/lib/blockLabel";
import { IconChevronLeft, IconChevronRight, IconTarget, IconFlask2 } from "@tabler/icons-react";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarContent() {
  const { assignments, assignmentsById, blocks, doneBlocks } = useSchedule();
  const markDone = useHomeworkStore((s) => s.markDone);
  const unmarkDone = useHomeworkStore((s) => s.unmarkDone);
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);
  const blockGroups = useMemo(() => groupBlocksByAssignment(blocks), [blocks]);

  const today = todayISO();
  const todayDate = useMemo(() => isoToDate(today), [today]);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const isCurrentMonth = viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  const dayInfo = useMemo(() => {
    const map = new Map<string, { classKeys: ClassKey[]; hasEvent: boolean }>();
    const touch = (date: string, classKey: ClassKey, isEvent: boolean) => {
      const entry = map.get(date) ?? { classKeys: [], hasEvent: false };
      if (!entry.classKeys.includes(classKey)) entry.classKeys.push(classKey);
      if (isEvent) entry.hasEvent = true;
      map.set(date, entry);
    };
    for (const b of blocks) {
      const a = assignmentsById.get(b.assignmentId);
      if (a) touch(b.date, a.classKey, false);
    }
    for (const a of assignments) {
      const isEvent = a.urgency === "test" || a.urgency === "quiz";
      if (isEvent || a.inClass) touch(a.dueDate, a.classKey, isEvent);
    }
    return map;
  }, [blocks, assignments, assignmentsById]);

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goToday() {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDate(today);
  }

  const selectedBlocks = useMemo(() => blocks.filter((b) => b.date === selectedDate), [blocks, selectedDate]);
  const selectedPinned = useMemo(
    () => assignments.filter((a) => !a.inClass && a.dueDate === selectedDate && (a.urgency === "test" || a.urgency === "quiz")),
    [assignments, selectedDate]
  );
  const selectedInClass = useMemo(
    () => assignments.filter((a) => a.inClass && a.dueDate === selectedDate),
    [assignments, selectedDate]
  );

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
    <div className="relative isolate px-4 pt-6 pb-4 space-y-4">
      <SakuraHeader height={130} />
      <h1 className="relative text-[22px] font-medium text-text pt-2 [text-shadow:0_1px_4px_rgba(0,0,0,0.7)]">
        Calendar
      </h1>

      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="rounded-full border border-border p-1.5 text-muted transition-all duration-150 hover:text-text hover:border-[#3a3a3a] active:scale-90"
        >
          <IconChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">{monthYearLabel(viewYear, viewMonth)}</span>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="text-xs rounded-full border border-accent/40 text-accent px-2 py-0.5 transition-all duration-150 hover:bg-accent/10 active:scale-95"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded-full border border-border p-1.5 text-muted transition-all duration-150 hover:text-text hover:border-[#3a3a3a] active:scale-90"
        >
          <IconChevronRight size={18} />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            const info = dayInfo.get(cell.iso);
            const isToday = isTodayISO(cell.iso);
            const isSelected = cell.iso === selectedDate;
            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedDate(cell.iso)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all duration-150 hover:bg-surface2 active:scale-95 ${
                  isSelected ? "bg-accent/15 border-accent/50" : "border-transparent"
                } ${info?.hasEvent && !isSelected ? "ring-1 ring-inset ring-accent/30" : ""}`}
              >
                <span
                  className={`h-5 w-5 flex items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-accent text-white font-semibold"
                      : cell.inMonth
                      ? "text-text"
                      : "text-muted/40"
                  }`}
                >
                  {cell.day}
                </span>
                <div className="flex gap-0.5 h-1.5">
                  {(info?.classKeys ?? []).slice(0, 4).map((ck) => (
                    <span
                      key={ck}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: classColor(ck, colorOverrides) }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">
          {monthDayLabel(selectedDate)}
          {isTodayISO(selectedDate) && " · Today"}
        </h2>

        {selectedPinned.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedPinned.map((a) => (
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

        {selectedInClass.length > 0 && (
          <div className="space-y-1.5">
            {selectedInClass.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm rounded-lg bg-surface border border-border px-3 py-2">
                <ClassChip classKey={a.classKey} color={classColor(a.classKey, colorOverrides)} />
                <span className="text-muted">{a.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {selectedBlocks.length === 0 && selectedPinned.length === 0 && selectedInClass.length === 0 && (
            <p className="text-sm text-muted py-6 text-center">Nothing scheduled.</p>
          )}
          {selectedBlocks.map((block) => {
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
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ClientOnly>
      <CalendarContent />
    </ClientOnly>
  );
}
