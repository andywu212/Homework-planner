// Turns a "what is this assignment" question into "how long will it take
// and how many blocks should it become" using seed_data.json defaults,
// then lets the multiplier store nudge that estimate over time.

import { estimateDefaults } from "./seedData";
import { ClassKey, Feedback, UrgencyRank, WorkType } from "./types";

export interface ClassifyInput {
  classKey: ClassKey;
  category: "AT" | "PP";
  title: string;
}

export interface Classification {
  workType: WorkType;
  urgency: UrgencyRank;
}

const has = (title: string, ...needles: string[]) => {
  const t = title.toLowerCase();
  return needles.some((n) => t.includes(n));
};

export function classifyAssignment({ classKey, category, title }: ClassifyInput): Classification {
  if (classKey === "envsus" || classKey === "health") {
    return { workType: "easy_any", urgency: "other" };
  }

  if (classKey === "physics") {
    if (has(title, "lab")) return { workType: "lab_writeup", urgency: "lab" };
    if (has(title, "ap classroom")) return { workType: "ap_classroom_weekly", urgency: "other" };
    if (has(title, "test")) return { workType: "test_review", urgency: "test" };
    if (has(title, "quiz")) return { workType: "quiz_review", urgency: "quiz" };
    if (has(title, "practice", "homework set", "hw set", "problem set")) {
      return { workType: "pp_practice", urgency: "hw" };
    }
    return { workType: category === "AT" ? "generic_at" : "generic_pp", urgency: "hw" };
  }

  if (classKey === "micro") {
    if (has(title, "test")) return { workType: "test_review", urgency: "test" };
    if (has(title, "frq")) return { workType: "frq", urgency: "frq" };
    if (category === "AT") return { workType: "at_application_problems", urgency: "hw" };
    return { workType: "pp", urgency: "hw" };
  }

  if (classKey === "world") {
    if (has(title, "reading notes", "reading")) return { workType: "reading_notes", urgency: "other" };
    if (has(title, "project")) return { workType: "at_project", urgency: "other" };
    return { workType: category === "AT" ? "generic_at" : "generic_pp", urgency: "hw" };
  }

  if (classKey === "lang") {
    if (has(title, "final draft", "final essay")) return { workType: "essay_final_draft", urgency: "essay" };
    if (has(title, "brainstorm", "evidence", "thesis", "organizer", "draft", "peer review", "essay")) {
      return { workType: "essay_step", urgency: "essay" };
    }
    if (category === "PP") return { workType: "pp", urgency: "hw" };
    return { workType: "at_short", urgency: "hw" };
  }

  if (classKey === "calc") {
    if (has(title, "video")) return { workType: "video_notes", urgency: "hw" };
    if (has(title, "notes")) return { workType: "video_notes", urgency: "hw" };
    if (has(title, "ws", "worksheet")) return { workType: "worksheet", urgency: "hw" };
    if (has(title, "ap problems", "ap classroom")) return { workType: "ap_classroom", urgency: "hw" };
    if (has(title, "fcq")) return { workType: "fcq_prep", urgency: "quiz" };
    if (has(title, "test")) return { workType: "test_review", urgency: "test" };
    if (has(title, "quiz")) return { workType: "quiz_review", urgency: "quiz" };
    return { workType: "problem_set", urgency: "hw" };
  }

  return { workType: category === "AT" ? "generic_at" : "generic_pp", urgency: "hw" };
}

export interface Estimate {
  totalMinutes: number;
  blockCountHint: number;
  blockSizeHint: number;
}

const GENERIC_KEY: Record<WorkType, string | null> = {
  video_notes: "video_notes",
  problem_set: "problem_set",
  worksheet: "worksheet",
  fcq_prep: "fcq_prep",
  quiz_review: null, // handled via *_block / *_blocks pair
  test_review: null,
  ap_classroom: "ap_classroom",
  pp_practice: null,
  ap_classroom_weekly: "ap_classroom_weekly",
  lab_writeup: "lab_writeup",
  pp: "pp",
  at_application_problems: "at_application_problems",
  frq: "frq",
  reading_notes: "reading_notes",
  at_project: "at_project",
  at_short: "at_short",
  essay_step: "essay_step",
  essay_final_draft: "essay_final_draft",
  easy_any: "any",
  generic_pp: "pp",
  generic_at: "at",
};

// work types that are "N blocks of M minutes" pairs in seed data,
// keyed by their "*_block" / "*_blocks" field prefix.
const PAIRED_KEY: Partial<Record<WorkType, string>> = {
  quiz_review: "quiz_review",
  test_review: "test_review",
  pp_practice: "pp_practice",
};

export function estimateFor(classKey: ClassKey, workType: WorkType): Estimate {
  const defaults =
    estimateDefaults[classKey] ?? estimateDefaults["generic"] ?? {};
  const generic = estimateDefaults["generic"] ?? {};

  const pairedPrefix = PAIRED_KEY[workType];
  if (pairedPrefix) {
    const perBlock = defaults[`${pairedPrefix}_block`] ?? 30;
    const count = defaults[`${pairedPrefix}_blocks`] ?? 2;
    return { totalMinutes: perBlock * count, blockCountHint: count, blockSizeHint: perBlock };
  }

  const key = GENERIC_KEY[workType];
  let minutes: number | undefined = key ? defaults[key] : undefined;
  if (minutes === undefined && key) minutes = generic[key];
  if (minutes === undefined) minutes = workType.startsWith("generic_at") ? generic.at : generic.pp;
  if (minutes === undefined) minutes = 30;

  const blockSize = Math.min(60, Math.max(25, minutes));
  const blockCount = Math.max(1, Math.ceil(minutes / 60));
  return { totalMinutes: minutes, blockCountHint: blockCount, blockSizeHint: Math.ceil(minutes / blockCount) };
}

export function multiplierKey(classKey: ClassKey, workType: WorkType): string {
  return `${classKey}:${workType}`;
}

export function applyMultiplier(minutes: number, multiplier: number): number {
  return Math.round(minutes * multiplier);
}

const MIN_MULT = 0.5;
const MAX_MULT = 2.5;
const STEP = 0.15;

export function adjustMultiplier(current: number, feedback: Feedback): number {
  let next = current;
  if (feedback === "faster") next = current * (1 - STEP);
  else if (feedback === "longer") next = current * (1 + STEP);
  return Math.min(MAX_MULT, Math.max(MIN_MULT, Math.round(next * 100) / 100));
}
