// Shift-swap requests. requestedDate is 'YYYY-MM-DD'; submittedAt is an ISO instant.
export function isSwapInPast(swap, today) {
  const requested = new Date(swap.requestedDate);
  return requested < today;
}

export function submittedOn(swap) {
  return new Date(swap.submittedAt);
}
