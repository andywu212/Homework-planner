"use client";

import ClientOnly from "@/components/ClientOnly";
import BlockCard from "@/components/BlockCard";
import ProgressBar from "@/components/ProgressBar";
import ClassChip, { classColor } from "@/components/ClassChip";
import SakuraHeader from "@/components/SakuraHeader";
import Collapse from "@/components/Collapse";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { computePoints, computeStreak, todayProgress } from "@/lib/stats";
import { todayISO } from "@/lib/dateUtils";
import { groupBlocksByAssignment, pinnedEventTitle } from "@/lib/blockLabel";
import { useMemo, useState } from "react";
import { Feedback } from "@/lib/types";
import {
  IconFlame,
  IconStarFilled,
  IconRefresh,
  IconAlertTriangle,
  IconChevronDown,
  IconTarget,
  IconFlask2,
} from "@tabler/icons-react";

function TodayContent() {
  const { assignments, assignmentsById, blocks, couldntFit, overloadNotes, doneBlocks, lastSynced, fetchError, syncing, refresh } =
    useSchedule();
  const markDone = useHomeworkStore((s) => s.markDone);
  const unmarkDone = useHomeworkStore((s) => s.unmarkDone);
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);
  const [showCouldntFit, setShowCouldntFit] = useState(false);

  const today = todayISO();
  const todaysBlocks = useMemo(() => blocks.filter((b) => b.date === today), [blocks, today]);
  const blockGroups = useMemo(() => groupBlocksByAssignment(blocks), [blocks]);
  const inClassToday = useMemo(
    () => assignments.filter((a) => a.inClass && a.dueDate === today),
    [assignments, today]
  );
  const quizzesTestsToday = useMemo(
    () => assignments.filter((a) => !a.inClass && a.dueDate === today && (a.urgency === "test" || a.urgency === "quiz")),
    [assignments, today]
  );
  const progress = todayProgress(blocks, doneBlocks, today);
  const streak = useMemo(() => computeStreak(blocks, doneBlocks, assignmentsById), [blocks, doneBlocks, assignmentsById]);
  const points = useMemo(() => computePoints(doneBlocks, assignmentsById), [doneBlocks, assignmentsById]);
  const overloadToday = overloadNotes.filter((n) => n.date === today);
  const plannedMinutes = todaysBlocks.reduce((sum, b) => sum + b.minutes, 0);

  function handleToggle(blockId: string) {
    const block = todaysBlocks.find((b) => b.id === blockId);
    if (!block) return;
    const isDone = !!doneBlocks[blockId];
    if (isDone) {
      unmarkDone(blockId);
      return;
    }
    const assignment = assignmentsById.get(block.assignmentId);
    if (!assignment) return;
    markDone(blockId, block.assignmentId, block.index, block.date, block.minutes, assignment.classKey, assignment.workType, null);
  }

  function handleFeedback(blockId: string, fb: Feedback) {
    const block = todaysBlocks.find((b) => b.id === blockId);
    if (!block) return;
    const assignment = assignmentsById.get(block.assignmentId);
    if (!assignment) return;
    markDone(blockId, block.assignmentId, block.index, block.date, block.minutes, assignment.classKey, assignment.workType, fb);
  }

  return (
    <div className="relative isolate px-4 pt-6 pb-4 space-y-4">
      <SakuraHeader />

      <header className="relative space-y-3 pt-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-muted [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-[22px] font-medium text-text mt-0.5 [text-shadow:0_1px_4px_rgba(0,0,0,0.7)]">Today</h1>
          </div>
          <button
            onClick={refresh}
            disabled={syncing}
            className="mt-1 rounded-full border border-border p-2 text-muted transition-all duration-150 hover:text-text hover:border-[#3a3a3a] active:scale-90 disabled:opacity-50"
            aria-label="Refresh"
          >
            <IconRefresh size={16} className={syncing ? "animate-spin" : ""} />
          </button>
        </div>

        <ProgressBar done={progress.done} total={progress.total} />

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <IconFlame size={15} className="text-accent" /> {streak}-day streak
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <IconStarFilled size={12} className="text-warn" /> {points} pts
          </span>
          <span>·</span>
          <span>{plannedMinutes} min planned</span>
        </div>
        {lastSynced && (
          <p className="text-[11px] text-muted">
            Synced {new Date(lastSynced).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
        {fetchError && (
          <p className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
            Couldn&apos;t reach Canvas ({fetchError}). Showing your last synced data.
          </p>
        )}
      </header>

      {overloadToday.map((n) => (
        <p key={n.date} className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
          {n.message}
        </p>
      ))}

      {quizzesTestsToday.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Today</h2>
          {quizzesTestsToday.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5"
            >
              {a.urgency === "test" ? (
                <IconFlask2 size={18} className="text-accent shrink-0" />
              ) : (
                <IconTarget size={18} className="text-accent shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">{pinnedEventTitle(a)}</p>
                <ClassChip classKey={a.classKey} color={classColor(a.classKey, colorOverrides)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {inClassToday.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">In class today</h2>
          {inClassToday.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm rounded-lg bg-surface border border-border px-3 py-2">
              <ClassChip classKey={a.classKey} color={classColor(a.classKey, colorOverrides)} />
              <span className="text-muted">{a.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Study blocks</h2>
        {todaysBlocks.length === 0 && (
          <p className="text-sm text-muted py-8 text-center">Nothing scheduled today. Nice.</p>
        )}
        {todaysBlocks.map((block) => {
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
              onToggleDone={() => handleToggle(block.id)}
              onFeedback={(fb) => handleFeedback(block.id, fb)}
            />
          );
        })}
      </div>

      {couldntFit.length > 0 && (
        <div className="rounded-lg border border-bad/30 bg-bad/10 overflow-hidden">
          <button
            className="w-full flex items-center justify-between text-left px-3 py-2 text-xs font-medium text-bad transition-colors hover:bg-bad/15"
            onClick={() => setShowCouldntFit((v) => !v)}
          >
            <span className="inline-flex items-center gap-1.5">
              <IconAlertTriangle size={14} />
              {couldntFit.length} item{couldntFit.length === 1 ? "" : "s"} couldn&apos;t fit anywhere
            </span>
            <IconChevronDown size={15} className={`chevron ${showCouldntFit ? "chevron-open" : ""}`} />
          </button>
          <Collapse open={showCouldntFit}>
            <ul className="px-3 pb-2 space-y-1 text-xs text-muted">
              {couldntFit.map((c, i) => (
                <li key={i}>
                  {c.title} — {c.minutesUnscheduled} min ({c.reason})
                </li>
              ))}
            </ul>
          </Collapse>
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <ClientOnly>
      <TodayContent />
    </ClientOnly>
  );
}
