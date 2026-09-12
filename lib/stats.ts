// Streak + points. Kept deliberately simple per the brief: lightweight,
// non-nagging, not a full gamification system.

import { addDaysISO, compareISO, todayISO } from "./dateUtils";
import { Assignment, Block, DoneRecord } from "./types";

export function computePoints(doneBlocks: Record<string, DoneRecord>, assignmentsById: Map<string, Assignment>): number {
  let points = 0;
  for (const rec of Object.values(doneBlocks)) {
    const a = assignmentsById.get(rec.assignmentId);
    const onTime = !a || compareISO(rec.date, a.dueDate) <= 0;
    if (onTime) points += rec.minutes;
  }
  return points;
}

/**
 * +1 streak per day (working backward from yesterday) where every AT block
 * scheduled for that day was completed. A day with no AT blocks doesn't
 * break the streak. Today doesn't count until it's over.
 */
export function computeStreak(
  blocks: Block[],
  doneBlocks: Record<string, DoneRecord>,
  assignmentsById: Map<string, Assignment>
): number {
  const byDate = new Map<string, Block[]>();
  for (const b of blocks) {
    const a = assignmentsById.get(b.assignmentId);
    if (!a || a.category !== "AT") continue;
    if (!byDate.has(b.date)) byDate.set(b.date, []);
    byDate.get(b.date)!.push(b);
  }

  let streak = 0;
  let cursor = addDaysISO(todayISO(), -1);
  let guard = 0;
  while (guard < 365) {
    const dayBlocks = byDate.get(cursor) ?? [];
    const allDone = dayBlocks.every((b) => !!doneBlocks[b.id]);
    if (dayBlocks.length === 0) {
      // Neutral day: keep walking back without breaking or extending yet,
      // but only up to a point (30 idle days = stop counting further back).
      if (guard > 30 && streak === 0) break;
      cursor = addDaysISO(cursor, -1);
      guard++;
      continue;
    }
    if (!allDone) break;
    streak++;
    cursor = addDaysISO(cursor, -1);
    guard++;
  }
  return streak;
}

export function todayProgress(blocks: Block[], doneBlocks: Record<string, DoneRecord>, dateISO: string) {
  const dayBlocks = blocks.filter((b) => b.date === dateISO);
  const done = dayBlocks.filter((b) => !!doneBlocks[b.id]).length;
  return { done, total: dayBlocks.length };
}
