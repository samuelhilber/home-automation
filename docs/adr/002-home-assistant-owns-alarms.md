# ADR-002: Home Assistant owns the alarms; Sonos only plays the sound

- Status: Accepted
- Date: 2026-11-03

## Context

Sonos sends no event when an alarm rings, so the TV could not react reliably.

## Decision

Alarms are defined and run in Home Assistant. Sonos only plays the sound.

## Consequences

The alarm depends on Home Assistant working; the Sonos backup alarm (ADR-020) covers a failure.
