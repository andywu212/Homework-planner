"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useHomeworkStore } from "./store";
import { buildAssignments } from "./buildAssignments";
import { scheduleAll, FrozenBlock } from "./scheduler";
import { applyMultiplier, multiplierKey } from "./estimator";
import { noSchoolDaysMD } from "./seedData";
import { Assignment } from "./types";

const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000; // "every couple of hours"

export function useSchedule() {
  const canvasEvents = useHomeworkStore((s) => s.canvasEvents);
  const lastSynced = useHomeworkStore((s) => s.lastSynced);
  const fetchError = useHomeworkStore((s) => s.fetchError);
  const syncing = useHomeworkStore((s) => s.syncing);
  const doneBlocks = useHomeworkStore((s) => s.doneBlocks);
  const multipliers = useHomeworkStore((s) => s.multipliers);
  const settings = useHomeworkStore((s) => s.settings);
  const setCanvasData = useHomeworkStore((s) => s.setCanvasData);
  const setSyncing = useHomeworkStore((s) => s.setSyncing);
  const setFetchError = useHomeworkStore((s) => s.setFetchError);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/canvas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCanvasData(data.events, data.fetchedAt);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Couldn't reach the Canvas feed.");
    } finally {
      setSyncing(false);
    }
  }, [setCanvasData, setFetchError, setSyncing]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignments: Assignment[] = useMemo(() => {
    const base = buildAssignments(canvasEvents);
    return base
      .filter((a) => !settings.hiddenClasses.includes(a.classKey))
      .map((a) => {
        if (a.inClass) return a;
        const mult = multipliers[multiplierKey(a.classKey, a.workType)] ?? 1;
        return { ...a, totalMinutesBase: applyMultiplier(a.totalMinutesBase, mult) };
      });
  }, [canvasEvents, multipliers, settings.hiddenClasses]);

  const assignmentsById = useMemo(() => new Map(assignments.map((a) => [a.id, a])), [assignments]);

  const frozenBlocks: Record<string, FrozenBlock> = useMemo(() => {
    const out: Record<string, FrozenBlock> = {};
    for (const [id, rec] of Object.entries(doneBlocks)) {
      out[id] = { date: rec.date, minutes: rec.minutes };
    }
    return out;
  }, [doneBlocks]);

  const schedule = useMemo(
    () => scheduleAll(assignments, frozenBlocks, settings, noSchoolDaysMD),
    [assignments, frozenBlocks, settings]
  );

  return {
    assignments,
    assignmentsById,
    blocks: schedule.blocks,
    couldntFit: schedule.couldntFit,
    overloadNotes: schedule.overloadNotes,
    doneBlocks,
    lastSynced,
    fetchError,
    syncing,
    refresh,
  };
}
