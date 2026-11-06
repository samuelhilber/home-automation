# ADR-028: Calendars are imported directly by the API, starting with read-only links

- Status: Accepted
- Date: 2026-11-06

## Context

The management web app merges iCloud and two Outlook accounts (work, school) into one view, lets Samuel switch calendars on and off and switch single events or whole series out of the morning screen, and shows new events by default (R4, R5, ADR-010, ADR-016). Nothing is marked inside the calendar apps. Samuel decided on 6 Nov 2026 that the API imports the calendars directly and not through Home Assistant integrations.

What the API needs: read-only access to the events of the next days (the TV shows today and tomorrow plus a week strip), recurring events expanded correctly, Zurich time zone, and a small amount of its own state: which calendars are on and which events or series are switched out.

Constraints: single user, no `sudo` and no router access (ADR-008), secrets never in Git (`CLAUDE.md`), a calendar link with a token inside counts as a secret, and the alarms never depend on this (ADR-002).

## Options

1. **Read-only calendar links (ICS).** iCloud ("public calendar" share link), Outlook ("publish calendar" link). The API downloads each link every 15 minutes and expands the events. No password, no sign-in flow, one code path for all three accounts, nothing that can change a calendar.
   - The link is the secret: anyone with it can read that calendar.
   - Outlook updates published calendars slowly (often an hour or more), and an employer or school administrator can switch publishing off. That is the main risk, and only Samuel can find out whether it is blocked for the work and school accounts.
2. **CalDAV for iCloud, Microsoft Graph for Outlook.** Live data and a proper sign-in. iCloud needs an app-specific password; Graph needs an app registration and an OAuth sign-in, and work and school tenants often require an administrator's consent. Two different code paths, tokens that expire, and passwords that live on the Pi.
3. **Home Assistant integrations.** Rejected by Samuel.

## Proposed decision

Start with option 1 for all three accounts, because it is the smallest thing that works and holds no passwords. If an account's administrator blocks publishing, that account moves to option 2 on its own (iCloud: CalDAV; Outlook: Graph), decided in a follow-up ADR with what is actually blocked.

- The links live in a git-ignored file on the Pi that is mounted into the API container (not in `apps/api/.env`, not in Git); the API never returns a link, only names and on/off state.
- The API keeps its own small state (calendars on or off, switched-out events and series, keyed by calendar id and the event's UID) in one JSON file in a Docker volume. It is a cache of choices, not a calendar database, and losing it only resets the switches. Settings (volume, time zone and so on) can use the same file later.
- Events are fetched on a timer and the last good answer is kept, so a slow or failing calendar does not blank the TV or the admin app (same rule as ADR-026).
- The importer uses an existing, maintained ICS library for recurrence rules and time zones instead of custom code.
- New events are shown by default; a switched-out series stays out when new occurrences appear.

## Consequences

- Entering a link in the admin app ("Verbinden") would send a secret through the browser; the signed-off sketch has that button. Until Samuel decides, links are added by hand in the file on the Pi and the admin app shows status only. Changing the button needs a reviewed sketch (`CLAUDE.md`, rule 2).
- Outlook events can be up to an hour or more behind. For a morning screen that shows today and tomorrow this is acceptable if the work calendar is mostly meetings planned days ahead; it is not for last-minute changes.
- No write access to any calendar is ever needed or requested.
- A leaked link exposes that one calendar until Samuel stops publishing it; the fix is to delete the link in the calendar app and publish a new one.
- Real event data is never committed; tests use made-up calendars (`CLAUDE.md`, privacy).

## Update 6 Nov 2026 (Samuel)

- **Outlook work:** the option to publish a calendar does not exist in his Outlook on the web (most likely switched off by the administrator), so this account is **not imported** for now. Graph stays an option for later if he wants it.
- **Outlook school:** he has a subscription link (ICS) from the school; it is imported as described above.
- **iCloud:** he is checking whether a public-calendar link can be made.
- Links are added by hand in the file on the Pi for now (question 4); the admin app shows status only. A late school calendar is acceptable (question 3).

## What Samuel had to find out or provide

1. For each of the three accounts: can a read-only link be created (iCloud: share the calendar as a public calendar; Outlook: Settings, Calendar, Shared calendars, Publish a calendar)? For work and school this may be blocked: please try and tell me which accounts work.
2. The links themselves, put into the git-ignored file on the Pi when it exists (not into chat or Git).
3. Whether an event that is a few hours late on the TV is acceptable for the work calendar, or whether live data is a must (which would mean Graph and an administrator's consent).
4. Whether entering links through the admin app matters to him, or editing a file on the Pi is fine for now.

## Update 6 Nov 2026 (implementation)

- Library: `node-ical` (maintained, expands recurrence rules, EXDATE and overrides, maps Windows time zone names). Times are converted to Zurich; all-day events keep their date.
- Files, set by environment variables of the api: `CALENDARS_FILE` (the links, git-ignored, mounted from the Pi) and `CALENDAR_STATE_FILE` (the switches, in a Docker volume). Format of the links file: `{"calendars":[{"id":"school","source":"Outlook Schule","name":"Stundenplan","url":"https://..."}]}`; `id` is letters, digits, `-` or `_`.
- The state file holds only calendar ids that are off and `calendarId:UID` keys of switched-out events. One key covers a single event and every occurrence of a series, so new occurrences of a switched-out series stay out.
- Routes: `GET /api/status/calendar?days=7` (calendars without links, events of the next days), `PATCH /api/calendar/calendars/:id` (`{on}`), `PATCH /api/calendar/events` (`{calendarId, uid, shown}`).
- Download errors are logged without detail, because an error text can contain the link. A multi-day event shows on its first day only.
