# Home Automation 1.0

A personal home-automation setup built around a Sony A95K TV, Sonos speakers and an iPhone, with Home Assistant on a Raspberry Pi as the hub.

Goal 1 for the 1.0 release:

- A new landing page on the TV.
- Alarms managed in Home Assistant: the alarm plays on Sonos, switches the TV on and shows the weather and the schedule (Apple Calendar + Outlook).
- Control from the iPhone, also from outside the home (Tailscale).

## Documentation

The project documentation is written as a living doc on claude.ai and versioned here as PDF exports.

| Version | Date | File |
| --- | --- | --- |
| v0.2 | 2026-11-03 | [docs/versions/2026-11-03_v0.2_project-documentation.pdf](docs/versions/2026-11-03_v0.2_project-documentation.pdf) |
| v0.1 | 2026-11-03 | [docs/versions/2026-11-03_v0.1_project-documentation.pdf](docs/versions/2026-11-03_v0.1_project-documentation.pdf) |

The doc holds the requirements, the decision log (ADRs), the architecture, risks, open questions, the build plan, setup guides and a glossary. What changed between versions is listed in [CHANGELOG.md](CHANGELOG.md).

Details of the home network (addresses, router, device list) are intentionally not part of this repository.

Later, the documentation moves into Markdown files in this repository (see ADR-009).

## Repository structure

```
home-automation/
├── CLAUDE.md          Guidance for Claude Code: rules, key decisions, conventions
├── README.md          Project overview (this file)
├── CHANGELOG.md       What changed in each documentation version
├── docs/
│   ├── versions/      PDF exports of the project documentation, one per version
│   ├── adr/           One Markdown file per Architecture Decision Record
│   └── HANDOFF.md      Where things stand and what comes next
├── homeassistant/     The Home Assistant configuration, under version control
└── prototypes/        UI prototypes (tv-kiosk, admin)
```

## Versioning

- File names follow `YYYY-MM-DD_vX.Y_project-documentation.pdf`.
- The minor version (0.1 → 0.2) goes up for each documentation update; 1.0 is the release of Goal 1.
- Every new version gets a line in the table above and an entry in `CHANGELOG.md`.
