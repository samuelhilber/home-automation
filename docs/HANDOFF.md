# Handoff: state of the project (3 Nov 2026)

Read `CLAUDE.md` first for rules and key decisions. This file covers where things stand and what comes next.

## Done

- Planning: requirements R1–R19, decisions ADR-001 to ADR-021 (newest PDF in `docs/versions/`).
- Hardware bought: Raspberry Pi 5 8 GB, official 27 W power supply, Flirc passive case. Storage: SanDisk Extreme Portable SSD 1 TB, already emptied (Home Assistant OS will wipe it anyway).
- Sony TV: storage freed up.
- Sonos: UPnP is on. The backup alarm exists in the Sonos app at **04:44**, switched **off**. Once Home Assistant runs, find it by that time, label it "Backup" and take it over (ADR-020).

## On hold

- **UI sketch:** Samuel is doing his own design research first and may add design skills. Do not start sketches or mockups until he says so.
- **PDF exports:** only when Samuel explicitly asks. Exports are expensive; keep work token-efficient.

## Open (Samuel)

- Ask the work and school IT whether Outlook calendar access through Microsoft Graph, or a published calendar link, is allowed, and whether work calendar data may be stored on a home server.
- Ask the ISP for the router's DHCP range (an email draft exists). Static IPs probably overlap it; once the range is known, pick a static address for the Pi outside it.

## Open (later)

- Watch overview for Netflix, Disney+, Prime Video, Apple TV+ and HBO Max: Trakt VIP or self-built fetchers. Research before build step 7.
- Choose the watchdog service (ADR-021) during the build.

## Next build steps (after the sketch is reviewed)

1. Install Home Assistant OS on the SSD (Raspberry Pi Imager on Samuel's Windows PC), boot the Pi.
2. Put the configuration under Git in `homeassistant/`, set up Tailscale, nightly backups.
3. TV test: Bravia integration with pre-shared key, "Remote start", Fully Kiosk (free version first).
4. Data sources, alarms, phone UI, watch overview, as in the build plan.

## Backend (management web app): what the mockup must contain

Runs on phone and computer. Single user, reached at home and through Tailscale. Every page needs loading, empty and "Pi not reachable" states.

1. **Overview:** next alarm (time, day, zone); system status (Pi online, watchdog OK); badge when updates are waiting; backup alarm status (time, on/off); quick action "show the morning screen on the TV now".
2. **Alarms:** list with time, weekdays, on/off switch. Edit or create: time; weekdays (single days or a custom group); Sonos zone (room or group); Spotify source (Discover Weekly for now); fixed volume (today 5); wake the TV on/off. Note that St. Gallen public holidays are skipped. No snooze. While an alarm rings: a big "Stop" button and a note that it stops by itself after 15 minutes.
3. **Calendars:** sources iCloud, Outlook work, Outlook school, each with its calendars switchable on and off. Event list for today and tomorrow with a "show in preview" switch per event. New events default to on; for a recurring event the switch on its first date applies to the whole series (mark series visibly, e.g. an icon).
4. **Updates:** pop-up with name, old and new version, release-notes link, "Install" and "Later". Two variants: during the day "Install" installs right away; at night (21:00 until 2 hours after the last alarm) it says "Will be installed on [date] at [time]". Queue of scheduled updates, and a history with results (success or failure). A daily phone notification at 21:00 announces waiting updates; results of queued updates go to the phone.
5. **System:** backup alarm (time and zone, read-only); watchdog (last check-in); last nightly backup (time and result).

Not decided yet, leave open in the mockup: settings for the watch overview, custom names for alarms.
