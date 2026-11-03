# ADR-007: The network stays on the router's /24 subnet

- Status: Proposed
- Date: 2026-11-03

## Context

Without router access the router keeps its /24 subnet, so addresses outside it would lose internet access.

## Decision

The network stays on the router's /24 subnet; devices are grouped by ranges in the last octet, outside the router's DHCP range.

## Consequences

The router's exact DHCP range is still open and has to be asked from the ISP's support. Network details are kept privately, not in this repository.
