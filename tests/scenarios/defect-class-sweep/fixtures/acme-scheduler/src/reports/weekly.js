import { formatShort } from '../lib/dates.js';

// weekStartDate is 'YYYY-MM-DD'.
export function weeklyHeading(report) {
  return `Week of ${formatShort(new Date(report.weekStartDate))}`;
}

// value may be 'YYYY-MM-DD' OR a full ISO instant depending on which upstream job wrote it.
// Nobody has been able to tell us which, and both appear in production rows.
export function bucketLabel(row) {
  const d = new Date(row.bucketDate);
  return formatShort(d);
}
