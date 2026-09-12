"use client";

import ClientOnly from "@/components/ClientOnly";
import BlockCard from "@/components/BlockCard";
import ProgressBar from "@/components/ProgressBar";
import ClassChip, { classColor } from "@/components/ClassChip";
import { useHomeworkStore } from "@/lib/store";
import { useSchedule } from "@/lib/useSchedule";
import { computePoints, computeStreak, todayProgress } from "@/lib/stats";
import { todayISO } from "@/lib/dateUtils";
import { useMemo, useState } from "react";
import { Feedback } from "@/lib/types";

function TodayContent() {
  const { assignments, assignmentsById, blocks, couldntFit, overloadNotes, doneBlocks, lastSynced, fetchError, syncing, refresh } =
    useSchedule();
  const markDone = useHomeworkStore((s) => s.markDone);
  const unmarkDone = useHomeworkStore((s) => s.unmarkDone);
  const colorOverrides = useHomeworkStore((s) => s.settings.classColorOverrides);
  const [showCouldntFit, setShowCouldntFit] = useState(false);

  const today = todayISO();
  const todaysBlocks = useMemo(() => blocks.filter((b) => b.date === today), [blocks, today]);
  const inClassToday = useMemo(
    () => assignments.filter((a) => a.inClass && a.dueDate === today),
    [assignments, today]
  );
  const progress = todayProgress(blocks, doneBlocks, today);
  const streak = useMemo(() => computeStreak(blocks, doneBlocks, assignmentsById), [blocks, doneBlocks, assignmentsById]);
  const points = useMemo(() => computePoints(doneBlocks, assignmentsById), [doneBlocks, assignmentsById]);
  const overloadToday = overloadNotes.filter((n) => n.date === today);

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
    <div className="px-4 pt-6 pb-4 space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Today · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h1>
          <button
            onClick={refresh}
            disabled={syncing}
            className="text-xs rounded-full border border-border px-2.5 py-1 text-muted disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Refresh"}
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>🔥 {streak} day streak</span>
          <span>·</span>
          <span>⭐ {points} pts</span>
          {lastSynced && (
            <>
              <span>·</span>
              <span>Synced {new Date(lastSynced).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            </>
          )}
        </div>
        {fetchError && (
          <p className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
            Couldn&apos;t reach Canvas ({fetchError}). Showing your last synced data.
          </p>
        )}
        <ProgressBar done={progress.done} total={progress.total} />
      </header>

      {overloadToday.map((n) => (
        <p key={n.date} className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
          {n.message}
        </p>
      ))}

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
              onToggleDone={() => handleToggle(block.id)}
              onFeedback={(fb) => handleFeedback(block.id, fb)}
            />
          );
        })}
      </div>

      {couldntFit.length > 0 && (
        <div className="rounded-lg border border-bad/30 bg-bad/10">
          <button
            className="w-full text-left px-3 py-2 text-xs font-medium text-bad"
            onClick={() => setShowCouldntFit((v) => !v)}
          >
            ⚠️ {couldntFit.length} item{couldntFit.length === 1 ? "" : "s"} couldn&apos;t fit anywhere {showCouldntFit ? "▲" : "▼"}
          </button>
          {showCouldntFit && (
            <ul className="px-3 pb-2 space-y-1 text-xs text-muted">
              {couldntFit.map((c, i) => (
                <li key={i}>
                  {c.title} — {c.minutesUnscheduled} min ({c.reason})
                </li>
              ))}
            </ul>
          )}
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
