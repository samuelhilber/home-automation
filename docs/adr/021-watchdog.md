# ADR-021: A watchdog notifies the phone when the Pi stops checking in

- Status: Accepted
- Date: 2026-11-03

## Context

Samuel's choice on 3 Nov 2026. Home Assistant cannot report its own failure, so an outside service has to notice the silence (dead man's switch). It also covers a Pi that is down for several days, when the backup alarm keeps its last time.

## Decision

The Pi sends regular check-ins to a free outside monitoring service, which notifies the phone when they stop.

## Consequences

The service is chosen during the build.
