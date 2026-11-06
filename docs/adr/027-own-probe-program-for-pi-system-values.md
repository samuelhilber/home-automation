# ADR-027: Pi system values come from a small probe program of our own

- Status: Accepted
- Date: 2026-11-06

## Context

The System page and the overview card of the management web app (ADR-016) show CPU load, temperature, memory, disk, uptime and whether the Pi reaches the internet. Home Assistant in Docker has none of these values (no Supervisor, ADR-024); its System Monitor integration is not set up. Samuel decided on 6 Nov 2026 that a program of our own on the Pi supplies them.

Constraints: no `sudo` on the Pi, Home Assistant and the alarms must not depend on it or be restarted for it (ADR-002), no secrets and no writes, few moving parts.

## Decision

`tools/pi-probe/pi_probe.py` is a read-only, standard-library Python program that serves one JSON document on `GET /status` (port 8788). `tools/pi-probe/deploy.sh` runs it as its own container `pi-probe` from the Home Assistant image that is already on the Pi (it contains Python), with the host's root disk mounted read-only; `restart: unless-stopped` brings it back after a reboot. The API (`apps/api`) reads it at `PI_PROBE_URL` and serves `/api/status/system`; Home Assistant's own answer is added so the page can say "Home Assistant antwortet". If the probe or Home Assistant does not answer, the route still answers and the page shows what is missing.

## Consequences

- One more small container, started and updated with `tools/pi-probe/deploy.sh` (needs `PI_HOST` and `PI_KEY`, not in Git).
- The probe's port is open on the home network and shows only harmless numbers. It is not published beyond the LAN and tailnet (same rule as ADR-026).
- Uses the Home Assistant image, so a Home Assistant image update does not break the probe, but removing that image would. Moving the probe into the API container (once it runs on the Pi, ADR-026) is possible later and would make the separate container unnecessary.
- The watchdog and the activity feed still have no data source (ADR-021).
