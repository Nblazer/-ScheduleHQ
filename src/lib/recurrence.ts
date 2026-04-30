import type { ReminderRecurrence } from "@prisma/client";

// A minimal reminder shape we need for occurrence math (avoids importing
// the full Prisma type into client components if we ever need to).
export type ReminderForOccurrence = {
  scheduledAt: Date | string;
  recurrence: ReminderRecurrence;
  recurrenceUntil: Date | string | null;
};

// Step a date forward by one recurrence increment, in-place.
function step(d: Date, kind: ReminderRecurrence) {
  switch (kind) {
    case "DAILY":
      d.setUTCDate(d.getUTCDate() + 1);
      return;
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + 7);
      return;
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + 1);
      return;
    case "YEARLY":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      return;
    default:
      return;
  }
}

// Generate every occurrence of a reminder that lands inside [from, to].
// Both endpoints are inclusive. Hard-caps the loop so a malformed
// recurrence can't infinite-spin.
export function* occurrencesIn(
  reminder: ReminderForOccurrence,
  from: Date,
  to: Date,
): Generator<Date> {
  const start = new Date(reminder.scheduledAt);
  const until = reminder.recurrenceUntil ? new Date(reminder.recurrenceUntil) : null;

  // Non-recurring: emit only the original occurrence if it lies in range.
  if (reminder.recurrence === "NONE") {
    if (start >= from && start <= to) yield new Date(start);
    return;
  }

  let cur = new Date(start);
  let safety = 0;
  while (cur <= to && safety < 5000) {
    if (until && cur > until) return;
    if (cur >= from) yield new Date(cur);
    step(cur, reminder.recurrence);
    safety++;
  }
}

// Find the next occurrence at or after `after`. Returns null if none.
export function nextOccurrence(
  reminder: ReminderForOccurrence,
  after: Date,
): Date | null {
  const start = new Date(reminder.scheduledAt);
  const until = reminder.recurrenceUntil ? new Date(reminder.recurrenceUntil) : null;

  if (reminder.recurrence === "NONE") {
    return start >= after ? new Date(start) : null;
  }
  let cur = new Date(start);
  let safety = 0;
  while (safety < 5000) {
    if (until && cur > until) return null;
    if (cur >= after) return new Date(cur);
    step(cur, reminder.recurrence);
    safety++;
  }
  return null;
}

// Determine if a reminder is currently inside its "notify-before" window
// relative to `now`. Returns the firing occurrence if so, else null.
// Skips occurrences the user has already dismissed (lastDismissedAt past
// the occurrence start).
export function dueOccurrence(
  reminder: ReminderForOccurrence & { notifyBeforeMinutes: number; lastDismissedAt: Date | string | null },
  now: Date,
  graceMs = 1000 * 60 * 60, // an hour past the moment, still considered due
): Date | null {
  const lead = reminder.notifyBeforeMinutes * 60 * 1000;
  const windowStart = new Date(now.getTime() - graceMs);
  const windowEnd = new Date(now.getTime() + lead);
  const dismissed = reminder.lastDismissedAt ? new Date(reminder.lastDismissedAt) : null;

  for (const occ of occurrencesIn(reminder, windowStart, windowEnd)) {
    // The occurrence becomes "due" when (occ - lead) <= now <= (occ + grace).
    const fireAt = new Date(occ.getTime() - lead);
    if (fireAt > now) continue;
    if (occ.getTime() + graceMs < now.getTime()) continue;
    if (dismissed && dismissed >= occ) continue;
    return occ;
  }
  return null;
}
