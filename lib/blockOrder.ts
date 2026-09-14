// Keeps not-done blocks on top (in their existing priority order) and
// sinks done ones to the bottom (in their existing order too), so
// checking something off visibly moves it out of the way and lets the
// next thing that needs doing slide up to take its place.
import { Block } from "./types";

export function sortDoneToBottom(blocks: Block[], doneBlockIds: Record<string, unknown>): Block[] {
  const notDone = blocks.filter((b) => !doneBlockIds[b.id]);
  const done = blocks.filter((b) => doneBlockIds[b.id]);
  return [...notDone, ...done];
}
