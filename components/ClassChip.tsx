import { classByKey } from "@/lib/seedData";
import { ClassKey } from "@/lib/types";

export function classColor(classKey: ClassKey, overrides: Partial<Record<ClassKey, string>>): string {
  return overrides[classKey] ?? classByKey[classKey]?.color ?? "#6b7280";
}

export function classLabel(classKey: ClassKey): string {
  return classByKey[classKey]?.name ?? "Other";
}

export default function ClassChip({ classKey, color }: { classKey: ClassKey; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {classLabel(classKey)}
    </span>
  );
}
