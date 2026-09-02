// CSV export. period.startDate / period.endDate are 'YYYY-MM-DD'.
export function toCsvRow(invoice, period) {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  return [
    invoice.id,
    start.toLocaleDateString(),
    end.toLocaleDateString(),
    invoice.total,
  ].join(',');
}
