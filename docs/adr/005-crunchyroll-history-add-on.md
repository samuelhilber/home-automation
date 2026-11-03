# ADR-005: A small add-on on the Pi fetches Crunchyroll history every hour

- Status: Accepted
- Date: 2026-11-03

## Context

Crunchyroll has no public history API. The account history also covers the TV. Samuel accepted the terms-of-service risk for this private use on 3 Nov 2026.

## Decision

A small add-on on the Pi fetches the Crunchyroll history every hour, using the unofficial API.

## Consequences

The API is undocumented and bot protection may block scripts; a real browser on the Pi is plan B.
