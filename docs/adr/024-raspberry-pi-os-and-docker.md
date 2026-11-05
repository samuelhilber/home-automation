# ADR-024: Raspberry Pi OS with Home Assistant in Docker replaces Home Assistant OS

- Status: Accepted
- Date: 2026-11-05

## Context

Home Assistant OS would not get the Pi through DHCP or mDNS at all, on the same board, SSD, cable and power supply that boot Raspberry Pi OS cleanly; the long troubleshooting chain (PSU swap, cables, router ports, case) turned out to be specific to the Home Assistant OS flash itself, not the hardware. Supervisor's add-on store was the main reason ADR-001 chose Home Assistant OS, but the planned watchdog (ADR-021) and Sonos backup alarm (ADR-020) both need only core Home Assistant integrations plus an outside service, so no add-on was ever actually required.

## Decision

The Pi runs Raspberry Pi OS; Home Assistant runs in the official Container image via `docker compose` (`~/homeassistant/docker-compose.yml`, config bind-mounted to `~/homeassistant/config`, `network_mode: host` for mDNS/SSDP discovery of Sonos and the Sony TV).

## Consequences

ADR-001 is superseded. Supervisor's automatic backups and OS updates are lost; a manual or cron replacement (`docker compose pull && up -d`, periodic `/config` backups) still needs designing. Everything else ADR-001 covered — the Pi 5 8 GB hardware, the SanDisk SSD, the Flirc passive case (ADR-017) — stands unchanged.
