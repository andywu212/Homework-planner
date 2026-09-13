// Turns a raw Block + its Assignment into what the card should actually
// say. Review/prep sessions for a quiz or test are never the quiz itself,
// so they're labeled "Study for X" — the bare title is reserved for the
// pinned indicator shown on the day the quiz/test actually happens.
// Multi-block assignments (a quiz needing 2 review sessions, a reading
// that splits into notes + a review block) get a "block N of M" suffix
// so two same-titled cards on the same day read as steps, not duplicates.

import { Assignment, Block } from "./types";

const REVIEW_WORK_TYPES = new Set(["quiz_review", "test_review", "fcq_prep"]);

export interface BlockGroupInfo {
  positionInGroup: number; // 0-based
  totalInGroup: number;
}

/** Group a schedule's blocks by assignment, in date order, to number them. */
export function groupBlocksByAssignment(blocks: Block[]): Map<string, BlockGroupInfo> {
  const byAssignment = new Map<string, Block[]>();
  for (const b of blocks) {
    if (!byAssignment.has(b.assignmentId)) byAssignment.set(b.assignmentId, []);
    byAssignment.get(b.assignmentId)!.push(b);
  }

  const info = new Map<string, BlockGroupInfo>();
  for (const group of byAssignment.values()) {
    group.sort((a, b) => a.index - b.index);
    group.forEach((b, i) => info.set(b.id, { positionInGroup: i, totalInGroup: group.length }));
  }
  return info;
}

export function blockDisplayTitle(assignment: Assignment, group: BlockGroupInfo): string {
  const { positionInGroup, totalInGroup } = group;
  const suffix = totalInGroup > 1 ? ` — block ${positionInGroup + 1} of ${totalInGroup}` : "";

  if (REVIEW_WORK_TYPES.has(assignment.workType)) {
    return `Study for ${assignment.title}${suffix}`;
  }

  if (assignment.workType === "reading_notes" && assignment.linkedQuizDate && totalInGroup > 1) {
    const isLastBlock = positionInGroup === totalInGroup - 1;
    if (isLastBlock) return "Review for Reading Quiz";
    const readingTotal = totalInGroup - 1;
    const readingSuffix = readingTotal > 1 ? ` — block ${positionInGroup + 1} of ${readingTotal}` : "";
    return `${assignment.title}${readingSuffix}`;
  }

  return `${assignment.title}${suffix}`;
}

/** The plain, un-prefixed label used for the pinned quiz/test-day indicator. */
export function pinnedEventTitle(assignment: Assignment): string {
  if (assignment.workType === "reading_notes" && assignment.linkedQuizDate) return "Reading Quiz";
  return assignment.title;
}
