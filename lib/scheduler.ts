// The backward-scheduling engine: turns Assignment[] into a day-by-day
// list of study Blocks, respecting available-time windows, splitting big
// tasks across multiple days, and never silently dropping anything that
// doesn't fit (it lands in `couldntFit` instead).

import { classByKey } from "./seedData";
import {
  addDaysISO,
  compareISO,
  isNoSchoolDayISO,
  isWeekendISO,
  timeToMinutes,
  todayISO,
} from "./dateUtils";
import {
  Assignment,
  Block,
  CouldntFitItem,
  OverloadNote,
  ScheduleResult,
  Settings,
  UrgencyRank,
} from "./types";

const URGENCY_RANK: Record<UrgencyRank, number> = {
  test: 0,
  quiz: 1,
  lab: 1,
  frq: 1,
  essay: 2,
  hw: 3,
  other: 4,
};

function priorityScore(a: Assignment): number {
  const categoryRank = a.category === "AT" ? 0 : 1;
  const urgencyRank = URGENCY_RANK[a.urgency];
  const classPriority = classByKey[a.classKey]?.priority ?? 2;
  // Composed so smaller = higher priority; due date only breaks ties
  // within the same bucket via the caller's secondary sort.
  return categoryRank * 1000 + urgencyRank * 100 + classPriority * 10;
}

function isEasyClass(a: Assignment): boolean {
  return a.classKey === "envsus" || a.classKey === "health";
}

interface DayWindow {
  start: number; // minutes
  end: number;
  remaining: number;
}

interface DayCapacity {
  date: string;
  windows: DayWindow[];
}

function buildDayCapacity(date: string, settings: Settings, noSchoolDaysMD: string[]): DayCapacity {
  const useWeekendRules = isWeekendISO(date) || isNoSchoolDayISO(date, noSchoolDaysMD);
  const source = useWeekendRules ? settings.weekendWindows : settings.schoolWindows;
  const windows = source.map((w) => {
    const start = timeToMinutes(w.start);
    const end = timeToMinutes(w.end);
    return { start, end, remaining: Math.max(0, end - start) };
  });
  return { date, windows };
}

function tryPlace(day: DayCapacity, minutes: number): boolean {
  const w = day.windows.find((w) => w.remaining >= minutes);
  if (!w) return false;
  w.remaining -= minutes;
  return true;
}

function dayHasAnyRoom(day: DayCapacity, minMinutes = 20): boolean {
  return day.windows.some((w) => w.remaining >= minMinutes);
}

/** Split `total` minutes into blocks of ~25-60 min (single-block tasks keep their natural size). */
function splitIntoBlocks(total: number, countHint?: number, sizeHint?: number): number[] {
  if (total <= 0) return [];
  let count = countHint && countHint > 0 ? countHint : Math.max(1, Math.round(total / (sizeHint || 45)));

  if (count === 1) return [total];

  let size = Math.round(total / count);
  while (size > 60 && count < 12) {
    count += 1;
    size = Math.round(total / count);
  }
  while (size < 25 && count > 1) {
    count -= 1;
    size = Math.round(total / count);
  }

  const sizes = new Array(count).fill(Math.floor(total / count));
  let remainder = total - sizes.reduce((a, b) => a + b, 0);
  for (let i = 0; i < sizes.length && remainder > 0; i++) {
    sizes[i] += 1;
    remainder -= 1;
  }
  return sizes;
}

function enumerateDates(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let d = startISO;
  let guard = 0;
  while (compareISO(d, endISO) <= 0 && guard < 400) {
    out.push(d);
    d = addDaysISO(d, 1);
    guard++;
  }
  return out;
}

/** Evenly-spaced target dates for `count` blocks across [start, end] (inclusive). */
function spreadDates(startISO: string, endISO: string, count: number): string[] {
  const all = enumerateDates(startISO, endISO);
  if (all.length === 0) return new Array(count).fill(startISO);
  if (count >= all.length) {
    const out = [...all];
    while (out.length < count) out.push(all[all.length - 1]);
    return out;
  }
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i * (all.length - 1)) / Math.max(1, count - 1));
    out.push(all[idx]);
  }
  return out;
}

export interface FrozenBlock {
  date: string;
  minutes: number;
}

export function scheduleAll(
  assignments: Assignment[],
  frozenBlocks: Record<string, FrozenBlock>,
  settings: Settings,
  noSchoolDaysMD: string[],
  horizonDays = 60
): ScheduleResult {
  const today = todayISO();
  const horizonEnd = addDaysISO(today, horizonDays);

  const days = new Map<string, DayCapacity>();
  const getDay = (date: string): DayCapacity => {
    let d = days.get(date);
    if (!d) {
      d = buildDayCapacity(date, settings, noSchoolDaysMD);
      days.set(date, d);
    }
    return d;
  };
  // Pre-warm so lookups for slightly-out-of-range dates (overload pushes) still work.
  for (const d of enumerateDates(today, addDaysISO(horizonEnd, 14))) getDay(d);

  const blocks: Block[] = [];
  const couldntFit: CouldntFitItem[] = [];
  const overloadByDate = new Map<string, number>();

  const visible = assignments.filter((a) => !a.inClass && a.totalMinutesBase > 0);
  const sorted = [...visible].sort((a, b) => {
    const s = priorityScore(a) - priorityScore(b);
    if (s !== 0) return s;
    return compareISO(a.dueDate, b.dueDate);
  });

  for (const a of sorted) {
    const sizes = splitIntoBlocks(a.totalMinutesBase, a.blockCountHint, a.blockSizeHint);

    // Keep already-completed blocks frozen at their original date/minutes.
    let doneCount = 0;
    for (let i = 0; i < sizes.length; i++) {
      const id = `${a.id}::${i}`;
      const frozen = frozenBlocks[id];
      if (frozen) {
        blocks.push({ id, assignmentId: a.id, index: i, date: frozen.date, minutes: frozen.minutes, order: priorityScore(a) });
        doneCount++;
      } else {
        break; // frozen indices are always a prefix (0..doneCount-1)
      }
    }

    const remainingSizes = sizes.slice(doneCount);
    if (remainingSizes.length === 0) continue;

    const finishBy = isEasyClass(a) ? a.dueDate : addDaysISO(a.dueDate, -1);
    const pushLimit = a.deadlineDate && compareISO(a.deadlineDate, finishBy) > 0 ? a.deadlineDate : finishBy;

    let startDate: string;
    if (isEasyClass(a)) {
      startDate = finishBy;
    } else {
      const spanDays = Math.max(remainingSizes.length, remainingSizes.length * 2 - 1);
      const raw = addDaysISO(finishBy, -(spanDays - 1));
      startDate = compareISO(today, raw) > 0 ? today : raw;
    }
    if (compareISO(startDate, today) < 0) startDate = today;
    if (compareISO(startDate, finishBy) > 0) startDate = finishBy; // due date already effectively passed

    const targets = spreadDates(startDate, finishBy, remainingSizes.length);

    remainingSizes.forEach((minutes, i) => {
      const target = targets[i];
      const searchOrder: string[] = [];
      for (const d of enumerateDates(target, finishBy)) searchOrder.push(d);
      for (const d of enumerateDates(startDate, target).reverse()) {
        if (!searchOrder.includes(d)) searchOrder.push(d);
      }
      for (const d of enumerateDates(today, startDate).reverse()) {
        if (!searchOrder.includes(d)) searchOrder.push(d);
      }
      if (compareISO(pushLimit, finishBy) > 0) {
        for (const d of enumerateDates(addDaysISO(finishBy, 1), pushLimit)) searchOrder.push(d);
      }

      let placedDate: string | null = null;
      let movedForOverload = false;
      for (const d of searchOrder) {
        const day = getDay(d);
        if (tryPlace(day, minutes)) {
          placedDate = d;
          movedForOverload = compareISO(d, finishBy) > 0;
          break;
        }
      }

      if (!placedDate) {
        couldntFit.push({
          assignmentId: a.id,
          title: a.title,
          classKey: a.classKey,
          minutesUnscheduled: minutes,
          reason: "No open time slot before the deadline.",
        });
        return;
      }

      if (movedForOverload) {
        overloadByDate.set(placedDate, (overloadByDate.get(placedDate) ?? 0) + 1);
      }

      const index = doneCount + i;
      blocks.push({
        id: `${a.id}::${index}`,
        assignmentId: a.id,
        index,
        date: placedDate,
        minutes,
        order: priorityScore(a),
        movedForOverload,
      });
    });
  }

  const overloadNotes: OverloadNote[] = Array.from(overloadByDate.entries()).map(([date, count]) => ({
    date,
    message: `Heavy day — moved ${count} low-priority item${count === 1 ? "" : "s"} to make room.`,
  }));

  blocks.sort((a, b) => compareISO(a.date, b.date) || a.order - b.order);

  return { blocks, couldntFit, overloadNotes };
}
