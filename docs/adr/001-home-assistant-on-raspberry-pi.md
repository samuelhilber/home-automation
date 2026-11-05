# ADR-001: Home Assistant OS on a Raspberry Pi is the platform

- Status: Superseded by ADR-024
- Date: 2026-11-03

## Context

Official integrations already cover the Sony TV, Sonos, iCloud and weather; custom code only fills the gaps.

## Decision

Home Assistant OS runs on a Raspberry Pi 5 8 GB with the own SanDisk SSD and a Flirc passive case, bought on 3 Nov 2026.

## Consequences

The Pi is the hub of the system and a single point of failure for the alarm (see ADR-020 and ADR-021).
