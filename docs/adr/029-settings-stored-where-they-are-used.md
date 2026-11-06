# ADR-029: Settings are stored where they are used

- Status: Accepted (Samuel, 6 Nov 2026)
- Date: 2026-11-06

## Context

The Einstellungen page shows six values that are still mock: time zone, skip St. Gallen holidays, default volume for new alarms, longest morning screen, time of the daily update notice and the install window. The page must become real without a second source of truth: Home Assistant owns the alarms and the TV switch-off (ADR-002, ADR-011), the API keeps no alarm database (ADR-025), and its own state is a small JSON file in a Docker volume (ADR-028).

Who reads each value decides where it should live:

| Setting | Read by | Editable in the app |
| --- | --- | --- |
| Time zone (`Europe/Zurich`) | everything | no, fixed |
| Skip holidays | Home Assistant alarms (Workday, ADR-012) | yes |
| Default volume for new alarms | the API, when it writes a new alarm | yes |
| Morning screen at most N minutes | Home Assistant TV automation (ADR-011) | yes |
| Update notice time | Home Assistant notification automation (ADR-018) | yes |
| Install window | Home Assistant, derived from the alarms (ADR-019) | no, read only |

## Options

1. **Everything in the API's JSON file.** One place, one code path. But Home Assistant automations cannot read it, so every value they use would need a copy in Home Assistant that can drift.
2. **Everything in Home Assistant helpers** (`input_boolean`, `input_number`, `input_datetime`). Automations read them directly and the API reads and writes them through the REST API it already uses. But the API's own default volume would then depend on Home Assistant being up.
3. **Split by reader (proposed).** Values that Home Assistant uses live in Home Assistant helpers; values only the API uses live in the API's JSON file.

## Proposed decision

Option 3.

- Skip holidays, morning screen maximum and update notice time become helpers in `homeassistant/` (declared in YAML under version control, with sensible defaults). The automations read the helpers. The API reads them for display and changes them with the normal service calls.
- Default volume is kept in the API's state file (the same file as ADR-028, under a `settings` key).
- Time zone and install window are not stored: the first is a constant, the second is computed from the alarms.
- Route: `GET /api/settings` (all values, each with where it came from) and `PATCH /api/settings` (changed keys only, validated: ranges, time format). A failed write leaves the old value and the page shows an error.
- No secrets in settings, ever.

## Consequences

- No value exists twice. Changing "skip holidays" in the app changes the helper the alarm automation reads, so it takes effect on the next alarm.
- If Home Assistant is down, the page shows the Home Assistant values as unknown (as the connections list already does), and the default volume still works.
- Existing hand-written automations must be changed once to read the helpers instead of fixed values. That touches alarm code, so it is tested on the non-real alarm first (`CLAUDE.md`).
- Helpers are created in YAML, not in the Home Assistant UI, so they survive a rebuild of the Pi.

## Update 6 Nov 2026 (implementation)

- Helpers in `homeassistant/configuration.yaml`: `input_boolean.ring_on_holidays` (inverted, so a fresh helper means the old behaviour "skip holidays"), `input_number.morning_screen_max_minutes`, `input_datetime.update_notice_time`. No `initial:`, so a restart keeps the last value. A fresh `input_number` starts at its minimum (1), so the value must be set once after the first start.
- The default volume has its own file, `SETTINGS_FILE` (`/data/state/settings.json` in the same Docker volume as the calendar state), because the calendar importer rewrites its whole file.
- Read by Home Assistant: the 06:30 weekday alarm, the evening backup sync (so both agree on holidays), the TV morning timer. App-made alarms get the holiday setting only when they are saved again, because the template is part of their automation.
- Nothing reads `update_notice_time` yet: the daily update notice does not exist (ADR-018).
- Routes: `GET /api/settings`, `PATCH /api/settings` (validated; unknown or read-only keys give 400). The admin page edits "skip holidays" only; the other values are shown until a reviewed sketch has edit controls.

## Questions for Samuel

1. Is the split by reader fine, or should everything stay in one place for simplicity?
2. Should the morning screen maximum and the update notice time be editable in 1.0, or stay read only with fixed values?
3. Should a changed setting show up in the activity feed (ADR-030)?
