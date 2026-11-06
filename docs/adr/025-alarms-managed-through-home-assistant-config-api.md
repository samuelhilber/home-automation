# ADR-025: Alarms made in the management web app are stored as Home Assistant automations

- Status: Accepted
- Date: 2026-11-06

## Context

The management web app (ADR-016) needs to create, change, switch and delete alarms. Home Assistant must keep running them (ADR-002), also when the app's backend is down. Samuel chose the stack on 6 Nov 2026: a small Node + TypeScript service in Docker on the Pi.

Three ways to get an alarm into Home Assistant were weighed:

1. The backend creates one automation per alarm through Home Assistant's automation config API (the same way the Home Assistant UI saves automations).
2. The backend writes YAML files into `automations/` and restarts Home Assistant.
3. The backend keeps the schedule and calls Home Assistant at the alarm time.

## Decision

Option 1. Each alarm is one automation with the id `app_alarm_<id>`, saved in `automations.yaml` next to the hand-written automations in `automations/`. Home Assistant is the only place that stores alarms; the backend keeps no database. To list alarms, the backend reads the automations with that id prefix and turns them back into alarms. Switching an alarm on or off turns the automation on or off.

An alarm automation triggers at its time, checks the weekday and calls `script.alarm_ring` with the zone, playlist, volume and "wake the TV" setting. Public holidays are skipped on Monday to Friday through the Workday sensor (ADR-012); on Saturday and Sunday they are not, because the sensor is also off on every weekend.

`script.alarm_ring` gets these four optional fields; their defaults are today's fixed values, so the hand-written alarm behaves exactly as before.

The backend reaches Home Assistant with a long-lived access token that lives in a git-ignored `.env` file, never in Git.

## Consequences

- Alarms keep ringing if the backend is down (ADR-002 respected). Option 3 would have broken this.
- No restart per edit (option 2): the backend reloads automations after a change.
- `configuration.yaml` needs a second automation entry (`automation ui: !include automations.yaml`) and an empty `automations.yaml` on the Pi.
- The Home Assistant UI shows these automations too and Samuel could edit them there. The backend reads back only the shape it wrote; an automation with the `app_alarm_` id that it cannot understand is neither shown nor overwritten.
- **Not solved here, still open:** the nightly backup sync (`alarm_backup_sync_2100`) and the real alarm both hard-code 06:30. Until the backup sync works from the earliest enabled alarm, alarms made in the app have no Sonos backup. This touches the safety net (ADR-020) and gets its own ADR and pull request. Until then the hand-written 06:30 alarm stays the one that matters.
