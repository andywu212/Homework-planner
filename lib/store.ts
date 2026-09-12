"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ClassKey, DoneRecord, Feedback, RawCanvasEvent, Settings } from "./types";
import { adjustMultiplier, multiplierKey } from "./estimator";

const DEFAULT_SETTINGS: Settings = {
  schoolWindows: [
    { start: "16:00", end: "18:00" },
    { start: "19:30", end: "21:30" },
  ],
  weekendWindows: [
    { start: "10:00", end: "12:00" },
    { start: "14:00", end: "17:00" },
    { start: "19:30", end: "21:00" },
  ],
  hiddenClasses: [],
  classColorOverrides: {},
};

interface HomeworkState {
  canvasEvents: RawCanvasEvent[];
  lastSynced: string | null;
  fetchError: string | null;
  syncing: boolean;

  doneBlocks: Record<string, DoneRecord>;
  multipliers: Record<string, number>;
  settings: Settings;

  setCanvasData: (events: RawCanvasEvent[], fetchedAt: string) => void;
  setSyncing: (v: boolean) => void;
  setFetchError: (err: string | null) => void;

  markDone: (
    blockId: string,
    assignmentId: string,
    index: number,
    date: string,
    minutes: number,
    classKey: ClassKey,
    workType: string,
    feedback: Feedback | null
  ) => void;
  unmarkDone: (blockId: string) => void;

  updateSettings: (partial: Partial<Settings>) => void;
  toggleHiddenClass: (classKey: ClassKey) => void;
  setClassColor: (classKey: ClassKey, color: string) => void;
  resetMultipliers: () => void;

  exportData: () => { doneBlocks: Record<string, DoneRecord>; multipliers: Record<string, number>; settings: Settings };
  importData: (data: { doneBlocks?: Record<string, DoneRecord>; multipliers?: Record<string, number>; settings?: Settings }) => void;
}

export const useHomeworkStore = create<HomeworkState>()(
  persist(
    (set, get) => ({
      canvasEvents: [],
      lastSynced: null,
      fetchError: null,
      syncing: false,

      doneBlocks: {},
      multipliers: {},
      settings: DEFAULT_SETTINGS,

      setCanvasData: (events, fetchedAt) =>
        set({ canvasEvents: events, lastSynced: fetchedAt, fetchError: null }),
      setSyncing: (v) => set({ syncing: v }),
      setFetchError: (err) => set({ fetchError: err }),

      markDone: (blockId, assignmentId, index, date, minutes, classKey, workType, feedback) => {
        const record: DoneRecord = {
          assignmentId,
          index,
          date,
          minutes,
          doneAt: new Date().toISOString(),
          feedback,
        };
        set((s) => ({ doneBlocks: { ...s.doneBlocks, [blockId]: record } }));

        if (feedback) {
          const key = multiplierKey(classKey, workType as any);
          const current = get().multipliers[key] ?? 1;
          const next = adjustMultiplier(current, feedback);
          set((s) => ({ multipliers: { ...s.multipliers, [key]: next } }));
        }
      },

      unmarkDone: (blockId) =>
        set((s) => {
          const next = { ...s.doneBlocks };
          delete next[blockId];
          return { doneBlocks: next };
        }),

      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
      toggleHiddenClass: (classKey) =>
        set((s) => {
          const hidden = s.settings.hiddenClasses.includes(classKey)
            ? s.settings.hiddenClasses.filter((k) => k !== classKey)
            : [...s.settings.hiddenClasses, classKey];
          return { settings: { ...s.settings, hiddenClasses: hidden } };
        }),
      setClassColor: (classKey, color) =>
        set((s) => ({
          settings: {
            ...s.settings,
            classColorOverrides: { ...s.settings.classColorOverrides, [classKey]: color },
          },
        })),
      resetMultipliers: () => set({ multipliers: {} }),

      exportData: () => ({
        doneBlocks: get().doneBlocks,
        multipliers: get().multipliers,
        settings: get().settings,
      }),
      importData: (data) =>
        set((s) => ({
          doneBlocks: data.doneBlocks ?? s.doneBlocks,
          multipliers: data.multipliers ?? s.multipliers,
          settings: data.settings ?? s.settings,
        })),
    }),
    {
      name: "homework-planner-store",
      version: 1,
    }
  )
);
