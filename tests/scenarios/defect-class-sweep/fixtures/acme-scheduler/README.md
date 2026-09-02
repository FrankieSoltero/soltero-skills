# acme-scheduler

Shift scheduling and invoicing for hourly staff. Dates that represent a calendar day are
stored as Postgres `DATE` columns and reach JavaScript as `'YYYY-MM-DD'` strings. Instants
(clock-in, submission, job runs) are stored as `timestamptz` and reach JavaScript as full
ISO-8601 strings with an offset.

Run the tests with `npm test`.
