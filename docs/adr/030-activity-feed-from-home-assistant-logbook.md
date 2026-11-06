# ADR-030: The activity feed comes from the Home Assistant logbook

- Status: Accepted (Samuel, 6 Nov 2026)
- Date: 2026-11-06

## Context

The overview shows "Letzte Aktivitäten", currently three mock lines such as "Watchdog geprüft", "Weckplan synchronisiert" and "Updates gefunden", plus a link "Protokoll öffnen". The meaningful events happen in Home Assistant (alarm rang and was stopped, backup alarm synced, update found, watchdog result), a few in the API (calendar import failed, setting changed). The API keeps no database for this kind of data (ADR-025), and the feed must not become a second log that can disagree with the real one.

A feed that lists every check-in would be noise: the watchdog runs every few minutes (ADR-021).

## Options

1. **Own event log in the API** (JSON lines or SQLite in the Docker volume). Full control and it can include API events, but it is a new store with retention and growth to look after, and Home Assistant would have to send every event to the API.
2. **Home Assistant logbook (proposed).** Automations write a short entry with the `logbook.log` service when something worth showing happens. The API reads the logbook through the REST API it already uses, keeps only our entries and maps them to the feed. Home Assistant's recorder handles storage and retention.
3. **Show Home Assistant's raw logbook.** Nothing to build, but it is full of entity state changes that mean nothing to Samuel.

## Proposed decision

Option 2.

- Each feed event is a `logbook.log` call with a fixed name prefix (for example `App: `), a short German title and one detail line. Automations that should appear: alarm rang and stopped (and how), backup alarm synced, updates found, update installed, watchdog failed or recovered, TV switched off.
- The watchdog logs **changes only** (ok to failed, failed to ok), not every check. "Watchdog geprüft" in the mock becomes a daily summary line at most.
- Route: `GET /api/status/activity?limit=20` returns newest first, `{time, title, detail}`, which is the shape the card already uses. The API filters by the prefix and caches the answer for a short time.
- "Protokoll öffnen" opens a page with a longer list of the same entries (up to the recorder's retention, 10 days by default).
- API-side events (calendar import broke, setting changed) are left out of 1.0; if wanted, the API can write them to the same logbook through the same service.

## Consequences

- One source: if it is not in the Home Assistant logbook, it is not in the feed, and nothing needs cleaning up in the API.
- Every automation that should be visible gets one extra action. That is small but touches alarm code, so it is tested on the non-real alarm first.
- If Home Assistant is down the feed shows nothing new and says so (same rule as the status routes in ADR-026). The watchdog covers that case separately.
- The exact way to read only our entries from the logbook route has to be checked against the running Home Assistant version before building; if filtering by prefix is not possible there, the fallback is one dedicated entity for feed entries.

## Questions for Samuel

1. Which events do you want to see? Proposal: alarm rang/stopped, backup alarm synced, updates found/installed, watchdog problems, TV switched off.
2. Is 10 days of history enough for "Protokoll öffnen"?
3. Should API events (broken calendar, changed setting) appear too, or is that for later?
