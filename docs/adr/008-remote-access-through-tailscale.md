# ADR-008: Remote access through Tailscale instead of Home Assistant Cloud

- Status: Accepted
- Date: 2026-11-03

## Context

Home Assistant Cloud costs EUR 75 a year, which is too steep. Tailscale is free and keeps Home Assistant off the public internet. Samuel chose it on 3 Nov 2026.

## Decision

Remote access uses Tailscale (free). Home Assistant is never exposed to the public internet.

## Consequences

The Tailscale VPN must stay connected on the phone, because leaving home is reported over the internet (ADR-011). Test this early.
