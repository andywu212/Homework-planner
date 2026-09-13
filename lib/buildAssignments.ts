// Merges every data source (Canvas feed, hand-transcribed Calc BC PDF,
// AP World reading-quiz calendar, and the Physics weekly recurring rule)
// into one flat Assignment[] the scheduler can work with.

import { parseSummary } from "./titleParser";
import { classForCanvasCourse, classByKey, apWorldReadingQuizzes, calcBcSchedule, estimateDefaults } from "./seedData";
import { classifyAssignment, estimateFor } from "./estimator";
import { addDaysISO, mdToISO, todayISO, isoToDate, dateToISO } from "./dateUtils";
import { Assignment, ClassKey, RawCanvasEvent } from "./types";

const OTHER_CLASS = { key: "other" as ClassKey, name: "Other", canvasMatch: null, priority: 2, color: "#6b7280" };

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

function fromCanvasEvent(evt: RawCanvasEvent): Assignment {
  const parsed = parseSummary(evt.summary, evt.description);
  const classInfo = parsed.courseLabel ? classForCanvasCourse(parsed.courseLabel) : null;
  const classKey = (classInfo?.key ?? OTHER_CLASS.key) as ClassKey;

  const eventDueISO = evt.dtstart.slice(0, 10);
  let dueDate = parsed.dueDateMD ? mdToISO(parsed.dueDateMD, eventDueISO) : eventDueISO;
  let deadlineDate = parsed.deadlineDateMD ? mdToISO(parsed.deadlineDateMD, eventDueISO) : null;

  if (classKey === "physics" && !deadlineDate) {
    deadlineDate = addDaysISO(dueDate, 2);
  }

  const { workType, urgency } = classifyAssignment({
    classKey,
    category: parsed.category,
    title: parsed.cleanTitle,
  });

  const est = estimateFor(classKey, workType);

  return {
    id: evt.uid,
    source: "canvas",
    classKey,
    title: parsed.cleanTitle || evt.summary,
    rawSummary: evt.summary,
    description: evt.description,
    url: evt.url,
    category: parsed.category,
    reassessable: parsed.reassessable,
    dueDate,
    deadlineDate,
    inClass: parsed.inClass,
    workType,
    urgency,
    totalMinutesBase: parsed.inClass ? 0 : est.totalMinutes,
    blockCountHint: est.blockCountHint,
    blockSizeHint: est.blockSizeHint,
    updatedAt: new Date().toISOString(),
  };
}

function classifyCalcItem(item: (typeof calcBcSchedule.items)[number]) {
  const name = item.name.toLowerCase();
  if (item.type === "quiz") {
    if (name.startsWith("fcq")) return { workType: "fcq_prep" as const, urgency: "quiz" as const, category: "PP" as const };
    return { workType: "quiz_review" as const, urgency: "quiz" as const, category: "AT" as const };
  }
  if (item.type === "test") {
    return { workType: "test_review" as const, urgency: "test" as const, category: "AT" as const };
  }
  if (item.type === "hw" || item.type === "notes") {
    if (/\bws\b|worksheet/.test(name)) return { workType: "worksheet" as const, urgency: "hw" as const, category: "PP" as const };
    if (/ap problems|ap classroom/.test(name)) return { workType: "ap_classroom" as const, urgency: "hw" as const, category: "PP" as const };
    if (item.type === "notes") return { workType: "video_notes" as const, urgency: "hw" as const, category: "PP" as const };
    return { workType: "problem_set" as const, urgency: "hw" as const, category: "PP" as const };
  }
  // "review" and "event" rows are in-class / informational only.
  return null;
}

function calcAssignments(): Assignment[] {
  return calcBcSchedule.items.map((item, i) => {
    const classified = classifyCalcItem(item);
    const dueMD = item.due ?? item.deadline ?? item.date;
    const dueDate = mdToISO(dueMD);
    const deadlineDate = item.deadline ? mdToISO(item.deadline) : null;

    if (!classified) {
      return {
        id: `calc::${i}::${slug(item.name)}`,
        source: "calc",
        classKey: "calc" as ClassKey,
        title: item.name,
        category: "PP",
        reassessable: null,
        dueDate: mdToISO(item.date),
        deadlineDate: null,
        inClass: true,
        workType: "generic_pp",
        urgency: "other",
        totalMinutesBase: 0,
        updatedAt: new Date().toISOString(),
      } as Assignment;
    }

    const { workType, urgency, category } = classified;
    const est = estimateFor("calc", workType);

    return {
      id: `calc::${i}::${slug(item.name)}`,
      source: "calc",
      classKey: "calc" as ClassKey,
      title: item.name,
      category,
      reassessable: item.reassess ?? null,
      dueDate,
      deadlineDate,
      inClass: false,
      workType,
      urgency,
      totalMinutesBase: est.totalMinutes,
      blockCountHint: est.blockCountHint,
      blockSizeHint: est.blockSizeHint,
      updatedAt: new Date().toISOString(),
    } as Assignment;
  });
}

function nextSunday(fromISO: string): string {
  const d = isoToDate(fromISO);
  const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSunday);
  return dateToISO(d);
}

function physicsWeeklyRecurring(weeks = 10): Assignment[] {
  const est = estimateFor("physics", "ap_classroom_weekly");
  const out: Assignment[] = [];
  const firstEnd = nextSunday(todayISO());
  for (let i = 0; i < weeks; i++) {
    const dueDate = addDaysISO(firstEnd, 7 * i);
    out.push({
      id: `recurring::physics::apclassroom::${dueDate}`,
      source: "recurring",
      classKey: "physics",
      title: "AP Classroom weekly practice",
      category: "PP",
      reassessable: null,
      dueDate,
      deadlineDate: null,
      inClass: false,
      workType: "ap_classroom_weekly",
      urgency: "other",
      totalMinutesBase: est.totalMinutes,
      blockCountHint: est.blockCountHint,
      blockSizeHint: est.blockSizeHint,
      updatedAt: new Date().toISOString(),
    });
  }
  return out;
}

function worldReadingQuizAssignments(canvasAssignments: Assignment[]): Assignment[] {
  const synthetic: Assignment[] = [];
  const reviewMinutes = estimateDefaults.world?.quiz_review ?? 20;

  for (const q of apWorldReadingQuizzes) {
    const quizDate = mdToISO(q.date);
    const matched = canvasAssignments.find(
      (a) => a.classKey === "world" && a.workType === "reading_notes" && a.dueDate === quizDate
    );
    if (matched) {
      matched.linkedQuizDate = quizDate;
      matched.urgency = "quiz";
      matched.blockCountHint = (matched.blockCountHint ?? 1) + 1;
      matched.totalMinutesBase += reviewMinutes;
      continue;
    }
    const est = estimateFor("world", "reading_notes");
    synthetic.push({
      id: `world_quiz::${quizDate}`,
      source: "world_quiz",
      classKey: "world",
      title: `Read ${q.sections}, take notes${q.label_uncertain ? " (unconfirmed)" : ""}`,
      category: "AT",
      reassessable: null,
      dueDate: quizDate,
      deadlineDate: null,
      inClass: false,
      workType: "reading_notes",
      urgency: "quiz",
      totalMinutesBase: est.totalMinutes + reviewMinutes,
      blockCountHint: est.blockCountHint + 1,
      blockSizeHint: est.blockSizeHint,
      linkedQuizDate: quizDate,
      updatedAt: new Date().toISOString(),
    });
  }
  return synthetic;
}

export function buildAssignments(canvasEvents: RawCanvasEvent[]): Assignment[] {
  const canvasAssignments = canvasEvents.map(fromCanvasEvent);
  const worldSynthetic = worldReadingQuizAssignments(canvasAssignments);
  const calc = calcAssignments();
  const recurring = physicsWeeklyRecurring();

  return [...canvasAssignments, ...worldSynthetic, ...calc, ...recurring];
}

export { OTHER_CLASS };
