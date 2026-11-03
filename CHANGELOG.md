# Changelog

All notable changes to the project documentation. Newest version first.

## v0.2 – 2026-11-03

Hardware bought, alarm safety net and update rules decided.

- Requirements R17–R19: update pop-up with manual confirmation, Sonos backup alarm, watchdog. R4 and R5 now describe the management web app (calendar choice, per-event preview switch; new events shown by default, recurring events follow their first date).
- Decision log ADR-014 to ADR-021:
  - Spotify started directly by Home Assistant (replaces the rejected ADR-013)
  - normal Google TV home screen in 1.0, Projectivy Launcher in 2.0
  - management web app for calendars and preview switches
  - passive case in the bedroom with nightly backups
  - updates only by hand and never at night (queued until 2 hours after the last alarm, or 10:00 on days without one)
  - Sonos backup alarm stored on the speaker
  - watchdog notification when the Pi stops checking in
- ADR-001 (Home Assistant on a Raspberry Pi) and ADR-009 (documentation as PDFs) accepted.
- Hardware: Raspberry Pi 5 8 GB, official 27 W power supply, Flirc passive case, own SanDisk Extreme Portable SSD 1 TB.
- Network section rewritten after a network scan: one /24 subnet confirmed, DHCP overlap risk added. Addresses, router and device list removed from the documentation and kept privately.
- Open questions down to three: calendar access (work and school IT), DHCP range (ISP), Trakt VIP or self-built fetchers.

## v0.1 – 2026-11-03

First documented version, after the kick-off and feasibility study.

- Requirements R1–R16 for the 1.0 release, all decided.
- Decision log ADR-001 to ADR-013: Home Assistant on a Raspberry Pi, alarms owned by Home Assistant, Tailscale for remote access, Crunchyroll history add-on, Fully Kiosk on the TV.
- Architecture diagram: cloud services, the Pi as hub, devices on the home network.
- Risks and limitations, including the warning about changing the subnet mask without router access.
- Eight open questions, a build plan in eight steps, setup guides (TV storage, network check) and a glossary.
