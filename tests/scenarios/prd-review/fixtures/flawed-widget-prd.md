# Feedback Widget — PRD

**Status:** Draft v0.3
**Owner:** TBD
**Date:** 2026-07-20

## 1. Problem

We will build an in-app feedback widget with a React slide-out panel and a
Postgres-backed triage queue so users can send feedback without leaving the
dashboard. Customers have been asking for something like this and we believe it
will improve retention.

## 2. Users

- **Support agents** at our B2B customers (validated: 6 interviews, June).
- **End users** of the dashboard (we assume they want to submit feedback; not
  yet validated, but stories below cover them).

## 3. Goals

- Improve the feedback experience.
- v1 keeps integrations out: no Jira sync, no Slack, widget + queue only.
- Increase engagement with the dashboard.

## 4. User Stories

- As an end user, I want submitting feedback to be quick and intuitive.
- As an end user, I want the widget to feel native to the dashboard.
- As a support agent, I want the triage queue to be fast so my backlog is easy.
  - Acceptance: queue loads quickly and actions feel responsive.
- As a support agent, I want feedback synced to Jira so nothing gets lost.

## 5. Scope

| # | Feature | Priority |
|---|---------|----------|
| 1 | Submit feedback | Must |
| 2 | Triage queue | Must |
| 3 | Jira sync | Must |
| 4 | Slack notifications | Must |
| 5 | Custom branding | Must |
| 6 | CSV export | Must |
| 7 | AI sentiment tagging | Must |
| 8 | Public voting board | Must |
| 9 | SSO for admin view | Should |

## 6. Requirements

- R1. Users can submit feedback from any page.
- R2. The widget must be fast and intuitive.
- R3. The triage queue should scale.
- R4. Feedback is stored securely.
- R7. Jira sync creates a linked ticket for every triaged item.

## 7. Success Metrics

1. Increase engagement 40%.
2. NPS improves significantly.
3. Churn reduced 20%.
4. 90% of feedback triaged within 24 hours.
5. 50% of users try the widget in week one.
6. Support tickets drop 30%.
7. Time-to-triage halves.
8. Feature adoption up 25%.
9. Session length increases.
10. Widget CSAT above 4.5.
11. Retention improves by Q3.
12. Viral coefficient above 1.1.

## 8. Open Questions

- TBD
