// Core data model shared across the app.

export type Category = "AT" | "PP";

export type ClassKey =
  | "calc"
  | "physics"
  | "micro"
  | "world"
  | "lang"
  | "envsus"
  | "health"
  | "other";

export interface ClassInfo {
  key: ClassKey;
  name: string;
  canvasMatch: string | null;
  priority: number; // 1 = AP core, 3 = easy classes
  color: string;
  notes?: string;
}

// The "type" of work an assignment represents. Used to look up default
// time estimates and how many blocks to split it into.
export type WorkType =
  | "video_notes"
  | "problem_set"
  | "worksheet"
  | "fcq_prep"
  | "quiz_review"
  | "test_review"
  | "ap_classroom"
  | "pp_practice"
  | "ap_classroom_weekly"
  | "lab_writeup"
  | "pp"
  | "at_application_problems"
  | "frq"
  | "reading_notes"
  | "at_project"
  | "at_short"
  | "essay_step"
  | "essay_final_draft"
  | "easy_any"
  | "generic_pp"
  | "generic_at";

export type UrgencyRank = "test" | "quiz" | "lab" | "frq" | "essay" | "hw" | "other";

export interface Assignment {
  id: string; // stable id: canvas UID or synthetic key
  source: "canvas" | "calc" | "world_quiz" | "recurring";
  classKey: ClassKey;
  title: string; // cleaned display title
  rawSummary?: string;
  description?: string;
  url?: string;
  category: Category;
  reassessable: boolean | null;
  dueDate: string; // ISO yyyy-mm-dd, "schedule for this date"
  deadlineDate: string | null; // ISO yyyy-mm-dd, hard cutoff
  inClass: boolean;
  workType: WorkType;
  urgency: UrgencyRank;
  totalMinutesBase: number; // before multiplier
  blockCountHint?: number; // suggested number of blocks to split into
  blockSizeHint?: number; // suggested minutes per block
  linkedQuizDate?: string | null; // for world reading notes -> quiz date
  updatedAt: string;
}

export interface Block {
  id: string; // `${assignmentId}::${index}`
  assignmentId: string;
  index: number;
  date: string; // ISO yyyy-mm-dd
  minutes: number;
  order: number; // order within the day
  movedForOverload?: boolean;
}

export type Feedback = "faster" | "about_right" | "longer";

export interface DoneRecord {
  assignmentId: string;
  index: number;
  date: string; // frozen date the block was scheduled/completed on
  minutes: number; // frozen minutes at completion time
  doneAt: string; // ISO timestamp
  feedback: Feedback | null;
}

export interface TimeWindow {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface Settings {
  schoolWindows: TimeWindow[];
  weekendWindows: TimeWindow[];
  hiddenClasses: ClassKey[];
  classColorOverrides: Partial<Record<ClassKey, string>>;
}

export interface RawCanvasEvent {
  uid: string;
  summary: string;
  description?: string;
  url?: string;
  dtstart: string; // ISO date
}

export interface CouldntFitItem {
  assignmentId: string;
  title: string;
  classKey: ClassKey;
  minutesUnscheduled: number;
  reason: string;
}

export interface OverloadNote {
  date: string;
  message: string;
}

export interface ScheduleResult {
  blocks: Block[];
  couldntFit: CouldntFitItem[];
  overloadNotes: OverloadNote[];
}
