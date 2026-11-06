# Architecture Decision Records

One file per decision. The project documentation is the source of truth; if a file contradicts the newest documentation PDF, the PDF wins.

| ID | Decision | Status |
| --- | --- | --- |
| [ADR-001](001-home-assistant-on-raspberry-pi.md) | Home Assistant OS on a Raspberry Pi is the platform | Superseded by ADR-024 |
| [ADR-002](002-home-assistant-owns-alarms.md) | Home Assistant owns the alarms; Sonos only plays the sound | Accepted |
| [ADR-003](003-cloud-services-for-external-access.md) | Cloud services by default for external access | Accepted |
| [ADR-004](004-alarm-schedule-and-stopping.md) | Several alarms on custom weekday groups, no snooze; stop with the Sonos button, the phone or a timeout | Accepted |
| [ADR-005](005-crunchyroll-history-add-on.md) | A small add-on on the Pi fetches Crunchyroll history every hour | Rejected |
| [ADR-006](006-fully-kiosk-on-the-tv.md) | The TV shows dashboards through Fully Kiosk | Accepted |
| [ADR-007](007-network-stays-on-routers-subnet.md) | The network stays on the router's /24 subnet | Accepted |
| [ADR-008](008-remote-access-through-tailscale.md) | Remote access through Tailscale instead of Home Assistant Cloud | Accepted |
| [ADR-009](009-documentation-as-pdf-then-markdown.md) | Documentation is a working copy on claude.ai, exported as PDF, later Markdown in the repository | Accepted |
| [ADR-010](010-calendars-merged-into-one-view.md) | All picked calendars merge into one calendar view | Accepted |
| [ADR-011](011-tv-switches-off-when-leaving.md) | The TV switches off after 15 minutes at the latest, or earlier when Samuel leaves home | Accepted |
| [ADR-012](012-public-holidays-from-workday.md) | Public holidays come from Home Assistant's Workday integration | Accepted |
| [ADR-013](013-spotify-via-sonos-favourite.md) | The Spotify playlist is saved as a Sonos favourite and Home Assistant starts it | Rejected |
| [ADR-014](014-spotify-started-by-home-assistant.md) | Home Assistant starts the Spotify playlist directly | Accepted |
| [ADR-015](015-google-tv-home-screen-in-1-0.md) | The TV keeps the normal Google TV home screen in 1.0 | Accepted |
| [ADR-016](016-management-web-app.md) | Calendars and the per-event preview switch are managed in one management web app | Accepted |
| [ADR-017](017-passive-case-in-the-bedroom.md) | The Pi sits in the bedroom in a passive, fanless case | Accepted |
| [ADR-018](018-updates-by-hand.md) | Updates are never installed automatically | Accepted |
| [ADR-019](019-no-updates-at-night.md) | No updates at night | Accepted |
| [ADR-020](020-sonos-backup-alarm.md) | One Sonos alarm is used as the backup alarm | Accepted |
| [ADR-021](021-watchdog.md) | A watchdog notifies the phone when the Pi stops checking in | Accepted |
| [ADR-022](022-tv-loads-pages-from-the-pi.md) | The TV loads its pages from the Raspberry Pi in the long term | Accepted |
| [ADR-023](023-no-watch-overview.md) | The watch overview is left out | Accepted |
| [ADR-024](024-raspberry-pi-os-and-docker.md) | Raspberry Pi OS with Home Assistant in Docker replaces Home Assistant OS | Accepted |
| [ADR-025](025-alarms-managed-through-home-assistant-config-api.md) | Alarms made in the management web app are stored as Home Assistant automations | Accepted |
| [ADR-026](026-api-serves-the-apps-from-the-pi.md) | The backend serves the admin app and the TV page from the Raspberry Pi | Accepted |
| [ADR-027](027-own-probe-program-for-pi-system-values.md) | Pi system values come from a small probe program of our own | Accepted |
| [ADR-028](028-calendars-imported-directly-by-the-api.md) | Calendars are imported directly by the API, starting with read-only links | Accepted |
| [ADR-099](099-leave-home-detection-comes-last.md) | The leave-home detection is fixed last | Accepted |
