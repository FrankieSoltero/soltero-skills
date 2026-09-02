export function undecidable(row) {
  // TODO(date-class): vendor sends both 'YYYY-MM-DD' and full ISO; support unanswered 2wks
  return new Date(row.effective_date);
}

export function alsoMarked(row) {
  // TODO(date-class): both formats present in production rows, source job unknown
  return new Date(row.bucketDate);
}
