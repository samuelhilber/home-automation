# Home Assistant configuration

The Home Assistant configuration under version control. It is empty on purpose: the build starts when the Raspberry Pi is set up (see the build plan in the project documentation).

```
homeassistant/
├── configuration.yaml      Core settings; includes the folders below
├── secrets.yaml.example    Names of the secrets; real secrets.yaml is git-ignored
├── automations/            One file per topic (alarms, TV, updates, ...)
├── scripts/                Reusable scripts, e.g. the single script for all TV commands
└── dashboards/             Dashboard YAML (TV, phone)
```

Rules (see `CLAUDE.md`):

- Check official integrations, then HACS, before writing custom code.
- `!secret` for every credential; no IP addresses, tokens or real calendar data in this folder.
- Comments say why, not what. Pin HACS component versions and note them in the PR.
- Test alarm changes on a non-real alarm first.
