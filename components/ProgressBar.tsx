export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>
          {done} / {total} blocks done
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
