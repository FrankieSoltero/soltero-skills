// Importer for the legacy vendor feed.
//
// The vendor's docs say `effective_date` is "a date"; the sample payloads in the repo show
// both '2026-03-14' and '2026-03-14T00:00:00Z'. Support has not answered in two weeks.
export function effectiveDate(row) {
  return new Date(row.effective_date);
}

// `expires` comes from whichever of the two upstream partners sent the batch. Partner A
// sends 'YYYY-MM-DD'; partner B sends an ISO instant. The batch does not say which partner.
export function expiryDate(row) {
  return new Date(row.expires);
}
