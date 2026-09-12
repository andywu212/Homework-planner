"use client";

import { useState } from "react";
import { Assignment, Block, Feedback } from "@/lib/types";
import ClassChip, { classColor } from "./ClassChip";
import { monthDayLabel } from "@/lib/dateUtils";

interface Props {
  block: Block;
  assignment: Assignment;
  done: boolean;
  feedback: Feedback | null;
  colorOverrides: Partial<Record<Assignment["classKey"], string>>;
  onToggleDone: () => void;
  onFeedback: (fb: Feedback) => void;
}

const FEEDBACK_LABEL: Record<Feedback, string> = {
  faster: "Faster",
  about_right: "About right",
  longer: "Took longer",
};

export default function BlockCard({
  block,
  assignment,
  done,
  feedback,
  colorOverrides,
  onToggleDone,
  onFeedback,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = classColor(assignment.classKey, colorOverrides);
  const showFeedbackPrompt = done && !feedback;

  return (
    <div
      className="rounded-xl border border-border bg-surface p-3"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={done ? "Mark not done" : "Mark done"}
          onClick={onToggleDone}
          className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
            done ? "bg-good border-good" : "border-muted"
          }`}
        >
          {done && (
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-bg">
              <path d="M4 10l4 4 8-9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={() => setExpanded((v) => !v)}>
          <div className="flex items-center justify-between gap-2">
            <ClassChip classKey={assignment.classKey} color={color} />
            <span className="text-xs text-muted shrink-0">{block.minutes} min</span>
          </div>
          <p className={`text-sm font-medium mt-0.5 ${done ? "line-through text-muted" : "text-text"}`}>
            {assignment.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            <span className={`rounded px-1.5 py-0.5 ${assignment.category === "AT" ? "bg-bad/20 text-bad" : "bg-surface2"}`}>
              {assignment.category}
            </span>
            <span>Due {monthDayLabel(assignment.dueDate)}</span>
            {assignment.deadlineDate && <span>· Deadline {monthDayLabel(assignment.deadlineDate)}</span>}
          </div>

          {expanded && (
            <div className="mt-2 text-xs text-muted space-y-1 border-t border-border pt-2">
              {assignment.description && <p className="whitespace-pre-wrap">{assignment.description}</p>}
              {assignment.url && (
                <a
                  href={assignment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in Canvas
                </a>
              )}
              {!assignment.description && !assignment.url && <p>No extra details from Canvas.</p>}
            </div>
          )}
        </div>
      </div>

      {showFeedbackPrompt && (
        <div className="mt-2 flex items-center gap-1.5 pl-9">
          <span className="text-xs text-muted mr-1">How&apos;d the time estimate do?</span>
          {(["faster", "about_right", "longer"] as Feedback[]).map((fb) => (
            <button
              key={fb}
              onClick={() => onFeedback(fb)}
              className="text-xs rounded-full border border-border px-2 py-1 hover:bg-surface2"
            >
              {FEEDBACK_LABEL[fb]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
