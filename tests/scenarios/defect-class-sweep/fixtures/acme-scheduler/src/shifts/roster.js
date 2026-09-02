import { daysBetween } from '../lib/dates.js';

// shift.workDate is 'YYYY-MM-DD'. shift.clockedInAt is a full ISO-8601 instant with offset.
export function shiftDay(shift) {
  return new Date(shift.workDate);
}

export function clockInInstant(shift) {
  return new Date(shift.clockedInAt);
}

export function rosterSpan(shifts) {
  const first = new Date(shifts[0].workDate);
  const last = new Date(shifts[shifts.length - 1].workDate);
  return daysBetween(first, last);
}
