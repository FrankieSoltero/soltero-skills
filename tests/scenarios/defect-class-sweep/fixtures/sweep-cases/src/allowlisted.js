export function inline(row) {
  return new Date(row.createdAt); // date-class:instant — timestamptz, correct as written
}

export function prevLine(row) {
  // date-class:instant — this column is an ISO-8601 instant with an offset
  return new Date(row.submittedAt);
}

export function stillAnInstance(row) {
  return new Date(row.workDate);
}
