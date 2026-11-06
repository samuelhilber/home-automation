# CLAUDE.md

Guidance for Claude Code in this repository. Keep it short and current: when a decision changes, update this file in the same pull request.

## Project

Home Automation 1.0 is Samuel's personal home-automation setup. Home Assistant, in Docker on a Raspberry Pi 5 running Raspberry Pi OS, is the hub; it drives a Sony A95K (Google TV), four Sonos speakers (Arc, Sub, two One SL) and talks to an iPhone.

Goal 1 for the 1.0 release:

- A new landing page and a morning screen on the TV.
- Alarms owned by Home Assistant: play Spotify on a Sonos zone, wake the TV, show weather and the schedule.
- Control from the iPhone, also from outside the home.

Single user (Samuel). Low running cost matters.

## Where things are decided

- The **project documentation** (requirements R1–R19, decision log ADR-001 to ADR-023, risks, open questions, build plan) is a living doc on claude.ai. It is the single source of truth. Each version is exported as a PDF to `docs/versions/`; read the newest one before changing anything that touches a decision.
- Decisions are also mirrored as Markdown in `docs/adr/`, one file per ADR.
- `CHANGELOG.md` summarises what changed between documentation versions.
- If something here contradicts the newest PDF, the PDF wins. Point out the conflict instead of guessing.

## Working rules

1. **Existing solutions first.** Check official Home Assistant integrations, then HACS, before writing custom code. Custom code only fills gaps.
2. **No build without a reviewed sketch.** UI work starts with a rough sketch that Samuel reviews. Do not implement screens he hasn't seen.
3. **Ask instead of assuming.** If a requirement or decision is open or unclear, stop and ask.
4. **Record decisions.** Any new architectural choice gets an ADR (context, decision, consequences) and is proposed to Samuel, not decided silently. This project is also a software-engineering learning exercise: explain choices, don't just make them.
5. **Small pull requests.** One topic per branch and PR. Samuel reviews and merges; never push to `main` directly.

## Privacy: never commit

- Network details: IP addresses, subnet, router model, ISP, device list or MAC addresses. They are kept privately outside this repo on purpose.
- Secrets: tokens, passwords, API keys, the Sony pre-shared key, Tailscale keys, calendar URLs with embedded tokens. In Home Assistant use `!secret` and keep `secrets.yaml` out of Git.
- Personal data from calendars or watch history (no real event exports or fixtures; use made-up test data).

If a task seems to need any of this, ask Samuel to provide it locally (e.g. in `CLAUDE.local.md` or `secrets.yaml`, both git-ignored).

## Key decisions to respect

- **Platform:** Raspberry Pi OS on a Raspberry Pi 5 8 GB, booting from an SSD, passive case in the bedroom; Home Assistant runs in Docker (the Container image), not Home Assistant OS, so there is no Supervisor or add-on store — check HACS before custom code instead (ADR-001 superseded, ADR-017, ADR-024).
- **Alarms:** Home Assistant owns them; Sonos only plays sound (ADR-002). Several alarms on single weekdays or custom weekday groups, no snooze; stop via Sonos button (pause detection), phone, or after 15 minutes (ADR-004). Skip St. Gallen public holidays via the Workday integration (ADR-012). Alarms made in the management web app are Home Assistant automations with the id prefix `app_alarm_`, written by `apps/api` through the config API and stored in `automations.yaml`; the backend keeps no alarm database and the hand-written ones stay in `automations/` (ADR-025).
- **Music:** Home Assistant starts the Spotify playlist directly and plays it on the chosen Sonos zone; fixed volume (ADR-014). Starting a Sonos favourite (ADR-013) was rejected.
- **Alarm safety net:** one Sonos alarm stored on the speaker as backup, synced nightly to 10 minutes after the next alarm, switched off by Home Assistant only after the real alarm was stopped (ADR-020). Sonos alarms have no names: Home Assistant finds the backup by its internal alarm ID and labels it "Backup", so never match it by name or create a second one. A watchdog with an outside dead-man's-switch service (ADR-021). Never weaken these.
- **TV:** Fully Kiosk shows the dashboards (ADR-006); normal Google TV home screen in 1.0, Projectivy only in 2.0 (ADR-015). The morning screen stays on at most 15 minutes, less when Samuel leaves home (ADR-011). All TV commands go through one script, so a broken integration is fixed in one place. The TV loads its pages from the Pi, not from files bundled on the TV itself (ADR-022).
- **Calendars:** iCloud plus two Outlook accounts (work, school), chosen in a management web app and merged into one view; a per-event preview switch, new events shown by default (R4, R5, ADR-010, ADR-016). Nothing gets marked inside the calendar apps.
- **Updates:** never automatic. A pop-up in the management web app announces them; Samuel confirms each one. Nothing installs from 21:00 until 2 hours after the last alarm (10:00 on days without one) (ADR-018, ADR-019).
- **Remote access:** Tailscale only (ADR-008). Home Assistant is never exposed to the public internet; no port forwarding (there is no router access anyway).
- **Network:** stay in the router's existing /24 subnet (ADR-007). Do not propose a different subnet mask.
- **No watch overview:** there is no tracker for shows or anime in 1.0: no Trakt, no fetchers, no Crunchyroll add-on, no series panel on the TV (ADR-023, replaces ADR-005). Do not propose one.

## Repository layout

```
home-automation/
├── CLAUDE.md          This file
├── README.md          Project overview and documentation version table
├── CHANGELOG.md       What changed in each documentation version
├── docs/
│   ├── versions/      PDF exports of the project documentation
│   ├── adr/           One Markdown file per ADR, NNN-short-title.md
│   └── HANDOFF.md      Where things stand and what comes next
├── apps/
│   ├── admin/         Management web app (React)
│   ├── tv/            Morning screen on the TV (React)
│   └── api/           Backend (Node + TypeScript, Fastify); alarms through the Home Assistant config API (ADR-025) and read-only status routes (`/api/status/*`) for the admin overview and TV panels
├── homeassistant/     The Home Assistant configuration under version control
└── prototypes/        UI prototypes (tv-kiosk, admin), signed off by Samuel; still inline-styled HTML, to be rewritten in React before real use
```

## Conventions

- Language in the repo: English.
- Documentation PDFs: `docs/versions/YYYY-MM-DD_vX.Y_project-documentation.pdf`. Each new version adds a row to the README table and an entry at the top of `CHANGELOG.md`.
- Branches: `docs/...`, `feat/...`, `fix/...`. Commit messages in the imperative ("Add alarm automation").
- Home Assistant YAML: split by topic (`automations/`, `scripts/`, `dashboards/`), `!secret` for every credential, comments that say why, not what. Pin HACS component versions and note them in the PR.
- Test changes that touch alarms on a non-real alarm first; the existing Sonos alarm stays active alongside new alarms for a week before switching over.

## Current status

Planning is done; the Raspberry Pi is set up and runs Home Assistant in Docker (ADR-024). The alarm chain (weekday alarm, TV wake, TV switch-off) is built and tested live on the Pi. UI prototypes for the TV and the admin/phone view are built and signed off by Samuel (`prototypes/`); they still need a React rewrite with CSS/JS in their own files before real use. PDF exports only on Samuel's explicit request. Details, open items and the backend spec for the mockup: [`docs/HANDOFF.md`](docs/HANDOFF.md).
