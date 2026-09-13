"use client";

import { useState } from "react";
import { IconCircle, IconCircleCheck, IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { Assignment, Block, Feedback } from "@/lib/types";
import ClassChip, { classColor } from "./ClassChip";
import Collapse from "./Collapse";
import { blockDisplayTitle, BlockGroupInfo } from "@/lib/blockLabel";
import { monthDayLabel } from "@/lib/dateUtils";

interface Props {
  block: Block;
  assignment: Assignment;
  group: BlockGroupInfo;
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
  group,
  done,
  feedback,
  colorOverrides,
  onToggleDone,
  onFeedback,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = classColor(assignment.classKey, colorOverrides);
  const showFeedbackPrompt = done && !feedback;
  const title = blockDisplayTitle(assignment, group);
  const hasDetails = !!(assignment.description || assignment.url);

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-3 transition-opacity duration-300 hover:border-[#3a3a3a] ${
        done ? "opacity-55" : "opacity-100"
      }`}
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={done ? "Mark not done" : "Mark done"}
          onClick={onToggleDone}
          className={`mt-0.5 shrink-0 rounded-full transition-all duration-150 hover:scale-110 active:scale-90 ${
            done ? "text-good" : "text-muted hover:text-text"
          }`}
        >
          {done ? <IconCircleCheck size={24} stroke={1.8} /> : <IconCircle size={24} stroke={1.8} />}
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => hasDetails && setExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between gap-2">
            <ClassChip classKey={assignment.classKey} color={color} />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted">{block.minutes} min</span>
              {hasDetails && (
                <IconChevronDown
                  size={15}
                  className={`chevron text-muted ${expanded ? "chevron-open" : ""}`}
                />
              )}
            </div>
          </div>
          <p className={`text-sm font-medium mt-0.5 ${done ? "line-through text-muted" : "text-text"}`}>
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${
                assignment.category === "AT" ? "bg-bad/15 text-bad" : "bg-surface2 text-muted"
              }`}
            >
              {assignment.category}
            </span>
            <span>Due {monthDayLabel(assignment.dueDate)}</span>
            {assignment.deadlineDate && <span>· Deadline {monthDayLabel(assignment.deadlineDate)}</span>}
          </div>

          <Collapse open={expanded && hasDetails}>
            <div className="mt-2 text-xs text-muted space-y-1.5 border-t border-border pt-2">
              {assignment.description && <p className="whitespace-pre-wrap">{assignment.description}</p>}
              {assignment.url && (
                <a
                  href={assignment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accentSoft hover:text-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in Canvas <IconExternalLink size={13} />
                </a>
              )}
            </div>
          </Collapse>
        </div>
      </div>

      {showFeedbackPrompt && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9">
          <span className="text-xs text-muted mr-1">How&apos;d the time estimate do?</span>
          {(["faster", "about_right", "longer"] as Feedback[]).map((fb) => (
            <button
              key={fb}
              onClick={() => onFeedback(fb)}
              className="text-xs rounded-full border border-border px-2 py-1 transition-all duration-150 hover:border-accent hover:text-accent hover:shadow-[0_0_10px_-2px_rgba(192,57,43,0.6)] active:scale-95"
            >
              {FEEDBACK_LABEL[fb]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
