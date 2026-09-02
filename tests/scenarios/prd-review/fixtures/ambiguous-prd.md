# PRD — Notification Preferences

**Owner:** Priya R. (PM) · **Status:** for review

## 1. Problem

Users cannot control which notifications they receive. Evidence: the Q3 customer
research deck (shared internally by the research team) and the support themes summarized
in it. Support has flagged this repeatedly.

## 2. Goals

- G1: Give users per-channel control of notifications.
- G2: Reduce notification-driven unsubscribes.

## 3. Requirements

- R1: A user can enable or disable email notifications.
- R2: A user can enable or disable push notifications.
- R3: Preference changes take effect for subsequently sent notifications.
- R4: The preferences screen is responsive on mobile.

## 4. Stories & acceptance criteria

**S1** — As a signed-in user, I want to turn off email notifications so my inbox stays
quiet. (Traces to R1.)
- Given I am on the settings screen, When I toggle "Email notifications" off, Then
  email notifications stop arriving promptly.
- Given I toggled email off, When I reload the page, Then the toggle reflects my choice.

**S2** — As a signed-in user, I want the preferences screen to work well on my phone.
(Traces to R4.)
- Given I open settings on a phone, When the screen renders, Then the layout is usable
  and nothing important is cut off.

## 5. Scope

**Must:** R1, R2, R3. **Should:** R4. **Won't (this release):** per-notification-type
granularity, digest scheduling, SMS.

## 6. Success metrics

- M1: Share of active users who open the preferences screen — baseline 0% (new screen),
  target 15% within 60 days, measured in the product analytics event stream.
- M2: Notification-driven unsubscribes — baseline 2.4%/month (billing export, Q3),
  target ≤1.5%/month within 90 days.
- M3 (guardrail): Total notifications delivered — baseline 4.1M/month, must not drop
  more than 30% within 90 days (analytics event stream).

## 7. Open questions

None outstanding.
