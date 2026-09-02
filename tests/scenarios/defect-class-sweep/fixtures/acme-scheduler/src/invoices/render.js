import { formatShort } from '../lib/dates.js';

// invoice.issuedDate and invoice.dueDate are 'YYYY-MM-DD' strings from Postgres DATE columns.
export function renderInvoiceHeader(invoice) {
  const issued = new Date(invoice.issuedDate);
  const due = new Date(invoice.dueDate);
  return {
    issued: formatShort(issued),
    due: formatShort(due),
  };
}

export function isOverdue(invoice, now) {
  return new Date(invoice.dueDate) < now;
}
