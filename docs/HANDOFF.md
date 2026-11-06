# Handoff: state of the project (6 Nov 2026)

Read `CLAUDE.md` first for rules and key decisions. This file covers where things stand and what comes next.

## Done

- Planning: requirements R1–R19, decisions ADR-001 to ADR-023 (newest PDF in `docs/versions/`; ADR-022 and ADR-023 also mirrored in `docs/adr/`).
- Hardware bought and set up: Raspberry Pi 5 8 GB, official 27 W power supply, Flirc passive case, SanDisk Extreme Portable SSD 1 TB. The Pi runs Raspberry Pi OS with Home Assistant in Docker (ADR-024).
- Sony TV: storage freed up.
- Sonos: UPnP is on. The backup alarm exists in the Sonos app (created at 04:44, recurrence "Once"). Home Assistant takes it over by its internal ID 980 (`switch.sonos_alarm_980`) through `script.alarm_backup`; the nightly sync is `alarm_backup_sync.yaml` (ADR-020).
- UI prototypes for the TV (`prototypes/tv-kiosk/`) and the admin/phone view (`prototypes/admin/`) built and signed off by Samuel. Still inline-styled HTML; need a React rewrite with CSS/JS in their own files before real use (common coding guideline), and the TV hasn't been tested with React yet.
- `homeassistant/` configuration skeleton (folders, minimal `configuration.yaml`, `secrets.yaml.example`) added under version control.

## On hold

- **PDF exports:** only when Samuel explicitly asks. Exports are expensive; keep work token-efficient.

## Open (Samuel)

- Ask the work and school IT whether Outlook calendar access through Microsoft Graph, or a published calendar link, is allowed, and whether work calendar data may be stored on a home server.
- Ask the ISP for the router's DHCP range (an email draft exists). Static IPs probably overlap it; once the range is known, pick a static address for the Pi outside it.

## Open (later)

- Choose the watchdog service (ADR-021) during the build.

## Next build steps

1. Done: Raspberry Pi OS and Home Assistant in Docker run on the Pi; Tailscale is installed.
2. Sync the live configuration with Git (today the files in `homeassistant/` are copied by hand), nightly backups.
3. TV test: Bravia integration with pre-shared key, "Remote start", Fully Kiosk (free version first).
4. Data sources, alarms, phone UI, as in the build plan (no watch overview, see ADR-023).

## Backend (management web app): what the mockup must contain

Runs on phone and computer. Single user, reached at home and through Tailscale. Every page needs loading, empty and "Pi not reachable" states.

1. **Overview:** next alarm (time, day, zone); system status (Pi online, watchdog OK, TV on / standby / not reachable); badge when updates are waiting; backup alarm status (time, on/off); quick action "show the morning screen on the TV now". The TV state is read from the Bravia integration (no custom code). When the TV is not reachable, show a hint that its address may have changed and the Bravia integration needs to point to the new one, and grey out the quick action with the same hint.
2. **Alarms:** list with time, weekdays, on/off switch. Edit or create: time; weekdays (single days or a custom group); Sonos zone (room or group); Spotify source (Discover Weekly for now); fixed volume (today 5); wake the TV on/off. Note that St. Gallen public holidays are skipped. No snooze. While an alarm rings: a big "Stop" button and a note that it stops by itself after 15 minutes.
3. **Calendars:** sources iCloud, Outlook work, Outlook school, each with its calendars switchable on and off. Event list for today and tomorrow with a "show in preview" switch per event. New events default to on; for a recurring event the switch on its first date applies to the whole series (mark series visibly, e.g. an icon).
4. **Updates:** pop-up with name, old and new version, release-notes link, "Install" and "Later". Two variants: during the day "Install" installs right away; at night (21:00 until 2 hours after the last alarm) it says "Will be installed on [date] at [time]". Queue of scheduled updates, and a history with results (success or failure). A daily phone notification at 21:00 announces waiting updates; results of queued updates go to the phone.
5. **System:** backup alarm (time and zone, read-only); watchdog (last check-in); last nightly backup (time and result).

Not decided yet, leave open in the mockup: custom names for alarms.
