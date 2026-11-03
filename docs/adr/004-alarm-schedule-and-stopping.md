# ADR-004: Several alarms on custom weekday groups, no snooze; stop with the Sonos button, the phone or a timeout

- Status: Accepted
- Date: 2026-11-03

## Context

Samuel's answers on 3 Nov 2026.

## Decision

Several independent alarms run on single weekdays or custom weekday groups. There is no snooze. A ringing alarm stops with the Sonos button, otherwise from the phone, otherwise after 15 minutes.

## Consequences

The Sonos button works by Home Assistant noticing that the speaker was paused; this is still to be tested.
