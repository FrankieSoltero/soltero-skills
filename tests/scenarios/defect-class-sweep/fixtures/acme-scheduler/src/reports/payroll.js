// payPeriod.endDate is 'YYYY-MM-DD'; runAt is an ISO instant with a Z suffix.
export function payrollWindow(payPeriod) {
  return {
    end: new Date(payPeriod.endDate),
    ranAt: new Date(payPeriod.runAt),
  };
}

// Already fixed by hand three weeks ago during the March incident.
export function cutoffDate(payPeriod) {
  const [y, m, d] = payPeriod.cutoffDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}
