# ADR-022: The TV loads its pages from the Raspberry Pi in the long term

- Status: Accepted
- Date: 2026-11-03

## Context

Samuel's choice on 3 Nov 2026. The Pi is already the hub (ADR-001) and Fully Kiosk shows dashboards from Home Assistant (ADR-006), so the TV needs no separate web host.

## Decision

Home Assistant on the Pi serves the pages and Fully Kiosk opens them.

## Consequences

The prototype pages move onto the Pi at the build step.
