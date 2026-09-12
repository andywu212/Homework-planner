// Date helpers. All "business" dates in this app are plain ISO strings
// ("YYYY-MM-DD") in the user's local timezone -- no time-of-day, no UTC
// conversion headaches. The 2026-27 school year runs Sept 2026 -> Aug 2027,
// so bare "M/D" strings from seed data are Sept-Dec => 2026, Jan-Aug => 2027.

const SCHOOL_YEAR_START_MONTH = 9; // September

export function mdToISO(md: string, referenceISO?: string): string {
  // "9/10" or "9.11.26" or "9/15" formats -> "YYYY-MM-DD"
  const cleaned = md.trim();
  const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const [, m, d, y] = dotMatch;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    return isoFromParts(year, parseInt(m, 10), parseInt(d, 10));
  }
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const month = parseInt(m, 10);
    let year: number;
    if (y) {
      year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    } else {
      year = month >= SCHOOL_YEAR_START_MONTH ? 2026 : 2027;
    }
    return isoFromParts(year, month, parseInt(d, 10));
  }
  // Fall back: unparseable, use reference or today.
  return referenceISO ?? todayISO();
}

function isoFromParts(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function todayISO(): string {
  return dateToISO(new Date());
}

export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return dateToISO(d);
}

export function diffDaysISO(a: string, b: string): number {
  const da = isoToDate(a).getTime();
  const db = isoToDate(b).getTime();
  return Math.round((db - da) / 86400000);
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWeekendISO(iso: string): boolean {
  const day = isoToDate(iso).getDay();
  return day === 0 || day === 6;
}

// Convert the bare "M/D" seed-data lists into ISO sets once.
function mdListToISOSet(list: string[]): Set<string> {
  return new Set(list.map((md) => mdToISO(md)));
}

let _noSchoolSet: Set<string> | null = null;
export function isNoSchoolDayISO(iso: string, noSchoolDaysMD: string[]): boolean {
  if (!_noSchoolSet) _noSchoolSet = mdListToISOSet(noSchoolDaysMD);
  return _noSchoolSet.has(iso);
}

export function weekdayShort(iso: string): string {
  return isoToDate(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export function monthDayLabel(iso: string): string {
  return isoToDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isTodayISO(iso: string): boolean {
  return iso === todayISO();
}

export function isPastISO(iso: string): boolean {
  return compareISO(iso, todayISO()) < 0;
}

/** Minutes since midnight for "HH:MM" */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
