# ADR-023: The watch overview is left out

- Status: Accepted
- Date: 2026-11-04

## Context

The overview of last-watched shows and anime needed viewing history from the streaming services. Trakt, the planned shortcut, has terms-of-service issues, and its streaming sync needs a VPPA consent (through Younify Connect) that Samuel cannot accept. Self-built fetchers would use unofficial APIs, cost an estimated two to three weeks of part-time work and break regularly. Samuel dropped the whole feature on 4 Nov 2026, Crunchyroll included.

## Decision

Release 1.0 has no watch overview: no Trakt, no fetchers, no Crunchyroll add-on, and no series panel on the TV screen.

## Consequences

ADR-005 (Crunchyroll add-on) is superseded. The requirement and the open question about Trakt in the project documentation on claude.ai still have to be updated there. If the feature returns later, reading Google TV's Watch Next data over ADB is an untested option that needs no third party.
