export function stamp(row) {
  return Date.parse(row.dueDate);
}
