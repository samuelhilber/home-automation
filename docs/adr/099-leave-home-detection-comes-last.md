# ADR-099: The leave-home detection is fixed last

- Status: Accepted
- Date: 2026-11-06

## Context

The leave-home branch of `tv_morning_timer` (ADR-011) is still untested: during the test on 6 Nov the phone stayed `home`. What is known from the Pi:

- `tv_morning_timer` watches `person.homeassistantclanker`, which follows `device_tracker.iphone_von_samuel` (iPhone companion app).
- The Home zone radius is 100 m.
- The last stored position before the restart on 6 Nov was `home` with 10 m accuracy.
- The live state and the iPhone settings cannot be read from the Pi (no HA token), so Samuel checks them on the phone.

## Decision

The fix and the test come last, after all other blocks. Then, in this order:

1. iPhone: location access for the Home app on "Always" with precise location on.
2. iPhone: background refresh on for the Home app.
3. Companion app: location sensors (zone tracking) and background refresh on.
4. Tailscale stays connected on the phone (ADR-008).
5. Start `alarm_ring` in the HA app and leave the Home zone before 15 minutes are up; the TV must switch off early.
6. Tick the leave-home box of the test plan of PR #17.

## Consequences

Until then the TV switches off after 15 minutes at the latest, which is the safe case of ADR-011.
