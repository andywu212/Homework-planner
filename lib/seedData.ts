import raw from "../seed_data.json";
import { ClassInfo, ClassKey } from "./types";

interface RawClass {
  key: string;
  name: string;
  canvas_match: string | null;
  priority: number;
  color: string;
  notes?: string;
}

export interface SeedData {
  classes: RawClass[];
  grading: {
    all_tasks_weight: number;
    practice_prep_weight: number;
    quarter_ends: Record<string, string>;
    no_late_work_last_n_days_of_quarter: number;
  };
  no_school_days: string[];
  half_days: string[];
  early_dismissal: string[];
  other_dates: Record<string, string>;
  estimate_defaults_minutes: Record<string, Record<string, number>>;
  recurring: Array<{
    class: string;
    name: string;
    category: string;
    cadence: string;
    minutes: number;
    any_day: boolean;
  }>;
  ap_world_reading_quizzes: Array<{
    date: string;
    sections: string;
    label_uncertain?: boolean;
  }>;
  calc_bc_schedule: {
    source: string;
    items: Array<{
      date: string;
      type: string;
      name: string;
      reassess?: boolean;
      deadline?: string;
      due?: string;
    }>;
  };
}

export const seedData = raw as unknown as SeedData;

export const classes: ClassInfo[] = seedData.classes.map((c) => ({
  key: c.key as ClassKey,
  name: c.name,
  canvasMatch: c.canvas_match,
  priority: c.priority,
  color: c.color,
  notes: c.notes,
}));

export const classByKey: Record<string, ClassInfo> = Object.fromEntries(
  classes.map((c) => [c.key, c])
);

const canvasMatchers = classes
  .filter((c) => c.canvasMatch)
  .map((c) => ({ classKey: c.key, needle: c.canvasMatch!.toLowerCase() }));

/** Match the "[Course Label]" suffix from a Canvas SUMMARY to one of our classes. */
export function classForCanvasCourse(courseLabel: string): ClassInfo | null {
  const norm = courseLabel.toLowerCase();
  const hit = canvasMatchers.find((m) => norm.includes(m.needle));
  return hit ? classByKey[hit.classKey] : null;
}

export const estimateDefaults = seedData.estimate_defaults_minutes;
export const noSchoolDaysMD = seedData.no_school_days;
export const halfDaysMD = seedData.half_days;
export const earlyDismissalMD = seedData.early_dismissal;
export const apWorldReadingQuizzes = seedData.ap_world_reading_quizzes;
export const calcBcSchedule = seedData.calc_bc_schedule;
export const recurringRules = seedData.recurring;
export const quarterEnds = seedData.grading.quarter_ends;
export const noLateWorkLastNDays = seedData.grading.no_late_work_last_n_days_of_quarter;
