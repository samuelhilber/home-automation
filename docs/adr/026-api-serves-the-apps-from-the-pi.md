# ADR-026: The backend serves the admin app and the TV page from the Raspberry Pi

- Status: **Proposed** (for Samuel to decide)
- Date: 2026-11-06

## Context

Three small programs are built and only run on the laptop in development:

- `apps/api`: the backend (Fastify). It talks to Home Assistant through its REST API with a long-lived token (ADR-025).
- `apps/admin`: the management web app, opened on the iPhone, also from outside the home (ADR-008, ADR-016).
- `apps/tv`: the morning screen. Fully Kiosk on the TV loads it from the Pi, not from files on the TV (ADR-022, ADR-006).

In development, vite serves both apps and forwards `/api` to the backend. On the Pi there is no vite, so something has to serve the built files (`npm run build` gives plain static files) and the API, and the token must stay on the Pi. Home Assistant runs in Docker next to it (ADR-024).

Constraints: low running cost and few moving parts (single user), no router access (so no port forwarding, ADR-008), Home Assistant never exposed to the internet, and the alarms must keep ringing when the backend is down (ADR-002, ADR-025).

## Options

1. **The backend serves everything.** One Node container: `/api/*` is the API, `/` the admin app, `/tv/` the TV page (built files served with `@fastify/static`). One port, no CORS, one thing to restart.
2. **A web server container (nginx or Caddy) in front.** It serves the built files and forwards `/api` to the backend container. Cleaner separation, one more container to configure and update.
3. **Serve the apps from Home Assistant's `www` folder** (as ADR-022 first imagined) and run the backend separately. The apps would then call the backend on another origin, which needs CORS and a second address on the TV and phone.

## Proposed decision

Option 1. A multi-stage Dockerfile builds both apps and the backend into one image; `docker compose` on the Pi runs it next to Home Assistant, with the Home Assistant address and token in an env file on the Pi that is not in Git. The container binds to the Pi's LAN address so that Fully Kiosk can open `http://<pi>:8787/tv/`; the phone reaches the admin app through Tailscale (`tailscale serve` can put HTTPS in front of the same port, no port forwarding). The TV page polls `/api/status/*` and keeps showing the last good answer when a refresh fails.

## Consequences

- One image, one container, one port; deploying is "build image, restart container". `tools/deploy-to-pi.sh` stays for the Home Assistant files only.
- Same origin everywhere, so no CORS and no per-device API address in the apps.
- Home Assistant and the alarms do not depend on this container (ADR-002 holds); if it is down, the admin app and the TV panels are down, the alarms are not.
- **The API has no login.** Anyone on the home network or the tailnet could change alarms. That is acceptable for a single-user home network behind Tailscale only if the container is never published beyond the LAN and the tailnet; adding a shared secret or Tailscale identity headers is a follow-up if Samuel wants it.
- The TV page needs the Pi's LAN address; it is not written into the repo (privacy rule), it lives in Fully Kiosk's settings on the TV.
- Building the image on the Pi 5 (arm64) works but is slow; building it on the laptop with `docker buildx` for arm64 and copying it over is an option for later.
- Not decided here: the exact Dockerfile and compose file (a separate pull request once this is accepted), whether the container starts on boot (yes, `restart: unless-stopped`), and where the watchdog check-in comes from (ADR-021).
