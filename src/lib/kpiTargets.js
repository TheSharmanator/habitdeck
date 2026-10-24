// Shared KPI target logic.
//
// A KPI has a base range (kpi.min / kpi.max) that applies to every day, and an
// optional per-weekday override stored in kpi.targets — a 7-slot array in
// MONDAY-FIRST order (the same order the habit schedule toggles use):
//
//   targets: [ null, { min: '5',  max: '9' }, null, null, null, null, null ]
//                      ^ Tuesday only
//
// `null` means "inherit the base range", so existing data (no targets key at
// all) keeps working untouched.

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// JS getDay() is Sunday-first; the app's day toggles are Monday-first.
export const dayIndexFromDate = (date = new Date()) => (date.getDay() + 6) % 7;

// The tracker rows are offsets 0..6 with 6 = today.
export const dayIndexForOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - offset));
  return dayIndexFromDate(d);
};

const toNumber = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const overrideFor = (kpi, dayIndex) => {
  const list = kpi && Array.isArray(kpi.targets) ? kpi.targets : null;
  if (!list || dayIndex < 0 || dayIndex > 6) return null;
  const t = list[dayIndex];
  if (!t || typeof t !== 'object') return null;
  if (toNumber(t.min) === null && toNumber(t.max) === null) return null;
  return t;
};

export function hasDayOverride(kpi, dayIndex) {
  return overrideFor(kpi, dayIndex) !== null;
}

export function hasAnyDayOverride(kpi) {
  for (let i = 0; i < 7; i++) if (hasDayOverride(kpi, i)) return true;
  return false;
}

// Effective min/max for a weekday. Falls back to the base range field by field,
// so a day can override just the max (e.g. Saturday steps 10000→20000).
export function dayTarget(kpi, dayIndex) {
  const baseMin = kpi ? kpi.min : undefined;
  const baseMax = kpi ? kpi.max : undefined;
  const t = overrideFor(kpi, dayIndex);
  if (!t) return { min: baseMin, max: baseMax, overridden: false };
  const min = toNumber(t.min) === null ? baseMin : t.min;
  const max = toNumber(t.max) === null ? baseMax : t.max;
  return { min, max, overridden: true };
}

// Numeric bounds; null means "unbounded on that side".
export function targetRange(kpi, dayIndex) {
  const t = dayTarget(kpi, dayIndex);
  return { min: toNumber(t.min), max: toNumber(t.max) };
}

export function statusForValue(kpi, dayIndex, rawVal) {
  const n = parseFloat(rawVal);
  if (!Number.isFinite(n)) return 'neutral';
  const { min, max } = targetRange(kpi, dayIndex);
  if (min !== null && n < min) return 'fail';
  if (max !== null && n > max) return 'fail';
  return 'success';
}

export function formatTarget(kpi, dayIndex) {
  const t = dayTarget(kpi, dayIndex);
  const min = t.min === '' || t.min === null || t.min === undefined ? '–' : t.min;
  const max = t.max === '' || t.max === null || t.max === undefined ? '–' : t.max;
  return `${min}-${max}`;
}

const sameAsBase = (kpi, value, field) => toNumber(value) === toNumber(kpi ? kpi[field] : undefined);

// Returns a NEW kpi with the given weekday/field set. Writing the last value
// back to the base range drops the override, so `targets` stays free of
// redundant null-equivalent entries.
export function setDayTarget(kpi, dayIndex, field, value) {
  const list = Array.isArray(kpi.targets) ? [...kpi.targets] : [null, null, null, null, null, null, null];
  while (list.length < 7) list.push(null);
  const current = list[dayIndex] || { min: kpi.min, max: kpi.max };
  const next = { min: current.min, max: current.max, [field]: value };
  if (sameAsBase(kpi, next.min, 'min') && sameAsBase(kpi, next.max, 'max')) {
    list[dayIndex] = null;
  } else {
    list[dayIndex] = next;
  }
  return { ...kpi, targets: list };
}

export function clearDayTarget(kpi, dayIndex) {
  const list = Array.isArray(kpi.targets) ? [...kpi.targets] : [null, null, null, null, null, null, null];
  while (list.length < 7) list.push(null);
  list[dayIndex] = null;
  return { ...kpi, targets: list };
}
