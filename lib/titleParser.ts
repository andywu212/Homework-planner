// Decodes the teacher-encoded shorthand in Canvas calendar SUMMARY lines.
// See CLAUDE_CODE_BRIEF.md section "Parsing the SUMMARY line" for the
// real-world examples this was built against.

import { Category } from "./types";

export interface ParsedTitle {
  courseLabel: string | null;
  category: Category;
  reassessable: boolean | null;
  dueDateMD: string | null; // "9/10" style, still needs year resolution
  deadlineDateMD: string | null;
  inClass: boolean;
  cleanTitle: string;
}

const EX_DATE_RE = /Ex\.?\s?D[DL]:?\s*\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?/gi;

function stripEmoji(s: string): string {
  try {
    // eslint-disable-next-line no-misleading-character-class
    return s.replace(/\p{Extended_Pictographic}/gu, "").trim();
  } catch {
    return s;
  }
}

function extractCourseLabel(summary: string): { rest: string; courseLabel: string | null } {
  const match = summary.match(/\[([^\]]+)\]\s*$/);
  if (match) {
    return { rest: summary.slice(0, match.index).trim(), courseLabel: match[1].trim() };
  }
  return { rest: summary, courseLabel: null };
}

function stripLeadingDateCode(s: string): string {
  return s.replace(/^\d{4}\s+/, "");
}

function findDate(s: string, label: "DD" | "DL"): string | null {
  const withoutEx = s.replace(EX_DATE_RE, " ");
  const re = new RegExp(`\\b${label}:?\\s*(\\d{1,2}[/.]\\d{1,2}(?:[/.]\\d{2,4})?)`, "i");
  const m = withoutEx.match(re);
  return m ? m[1] : null;
}

function findDueFallback(s: string): string | null {
  const withoutEx = s.replace(EX_DATE_RE, " ");
  const m = withoutEx.match(/\bDue:?\s*(\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?)/i);
  return m ? m[1] : null;
}

function findEocBoth(s: string): string | null {
  const m = s.match(/DD\/DL\s*(?:EOC)?\s*:?\s*(\d{1,2}\/\d{1,2})/i);
  return m ? m[1] : null;
}

function detectCategory(s: string): { category: Category; reassessable: boolean | null } {
  // "(R)"/"(NR)" alone are reassessment markers, not category. Category is
  // an AT/PP token, possibly combined like "AT/R", "PP/NR", or inside a
  // parenthetical like "(PP - NR - Due 9/14)" or "(AT - NR - DD: ...)".
  let category: Category | null = null;
  let reassessable: boolean | null = null;

  const combined = s.match(/\b(AT|PP)\s*\/\s*(R|NR)\b/i);
  if (combined) {
    category = combined[1].toUpperCase() as Category;
    reassessable = combined[2].toUpperCase() === "R";
  }

  if (!category) {
    const inParens = s.match(/\((?:AT|PP)\b[^)]*\)/i);
    if (inParens) {
      category = /\bAT\b/i.test(inParens[0]) ? "AT" : "PP";
    }
  }

  if (!category) {
    // Bare leading "AT " / "PP " token.
    const leading = s.match(/(?:^|\s)(AT|PP)\b/);
    if (leading) category = leading[1].toUpperCase() as Category;
  }

  if (reassessable === null) {
    if (/\(R\)|\/R\b/.test(s)) reassessable = true;
    else if (/\(NR\)|\/NR\b/.test(s)) reassessable = false;
  }

  // Fallback for malformed/unbalanced parentheticals, e.g.
  // "(AT - NR - DD: 9/14 DL: 9/15" with no closing ")".
  if (reassessable === null) {
    if (/\bNR\b/.test(s)) reassessable = false;
    else if (/\bR\b/.test(s)) reassessable = true;
  }

  return { category: category ?? "AT", reassessable };
}

function detectInClass(titlePart: string, description?: string): boolean {
  if (/-\s*IC\s*$/i.test(titlePart.trim())) return true;
  const desc = (description ?? "").toLowerCase();
  if (/\bin class\b/.test(desc) || /today you will/.test(desc) || /end of class/.test(desc)) {
    return true;
  }
  return false;
}

function cleanUpTitle(s: string): string {
  let t = s;
  t = t.replace(EX_DATE_RE, " ");
  t = t.replace(/\([^)]*\b(?:DD|DL|Due|NR)\b[^)]*\)/gi, " "); // "(DD 9/10 - ... - DL 9/17)", "(PP - NR - Due 9/14)"
  t = t.replace(/\b(?:DD|DL):?\s*\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?/gi, " ");
  t = t.replace(/\bDue:?\s*\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?/gi, " ");
  t = t.replace(/\(\s*(?:AT|PP)\s*(?:\/\s*(?:R|NR))?\s*\)/gi, " ");
  t = t.replace(/\((?:R|NR)\)/gi, " ");
  t = t.replace(/\b(?:AT|PP)\s*\/\s*(?:R|NR)\b/gi, " ");
  t = t.replace(/(?:^|\s)(?:AT|PP)(?=\s)/g, " ");
  t = t.replace(/-\s*IC\s*$/i, " ");

  // Trailing unbalanced fragment from a malformed source, e.g.
  // "(AT - NR -    ,    " left over after date tokens were stripped out
  // of an opening "(" that was never closed.
  const openIdx = t.lastIndexOf("(");
  if (openIdx !== -1 && !t.includes(")", openIdx)) {
    const tail = t.slice(openIdx + 1);
    if (/^[\sA-Z,\-]*$/.test(tail)) t = t.slice(0, openIdx);
  }
  t = t.replace(/[-,]\s*$/, " ");
  t = t.replace(/\(\s*\)/g, " ");
  t = t.replace(/\s{2,}/g, " ").trim();
  t = t.replace(/^[-\s]+|[-\s]+$/g, "");
  return t || s.trim();
}

export function parseSummary(summary: string, description?: string): ParsedTitle {
  let s = stripEmoji(summary);
  s = stripLeadingDateCode(s);
  const { rest, courseLabel } = extractCourseLabel(s);

  const eocDate = findEocBoth(rest);
  const dueDateMD = eocDate ?? findDate(rest, "DD") ?? findDueFallback(rest);
  const deadlineDateMD = eocDate ?? findDate(rest, "DL");

  const { category, reassessable } = detectCategory(rest);
  const inClass = detectInClass(rest, description);
  const cleanTitle = cleanUpTitle(rest);

  return {
    courseLabel,
    category,
    reassessable,
    dueDateMD,
    deadlineDateMD,
    inClass,
    cleanTitle,
  };
}
