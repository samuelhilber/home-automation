# ADR-032: The watchdog is Healthchecks.io, pinged by Home Assistant

- Status: Accepted
- Date: 2026-11-18

## Context

ADR-021 decided that the Pi sends regular check-ins to a free outside service that notifies the phone when they stop, and left the choice of service to the build. Until now the watchdog has no data source: the System page, the status card and the settings row show made-up values.

The check-in must notice more than a dead Pi: a Home Assistant that hangs or stops while the Pi is up would also leave the alarms silent. The page must also be able to show when the last check-in happened.

Samuel chose Healthchecks.io on 18 Nov 2026. It is free for this use and built for this kind of dead-man's switch. It has no iPhone app of its own; the phone is notified through an integration (ntfy, a free app, is the plan; Pushover would work as well).

## Decision

- **Check-in:** a Home Assistant automation calls the check's ping URL every 5 minutes through a `rest_command`. The ping comes from Home Assistant, not from a cron job on the Pi, so a stopped Home Assistant is noticed too. The ping URL is a secret: `!secret` in `secrets.yaml`, never in the repo.
- **Alarm:** the check has a period of 5 minutes and a grace time of 10 minutes. After about 15 minutes of silence Healthchecks.io sends a message to the phone through ntfy.
- **Display:** the API reads the time of the last ping from the Healthchecks.io API with a read-only key and serves it on `GET /api/status/watchdog`. The key is an environment variable on the Pi, not in the repo. The admin app replaces its placeholder watchdog values (System page, status card, settings row) with this route.
- **Failure of the reading:** if the service or the key does not answer, the page shows "unknown", never "OK".
- **Testing:** first with a separate test check, so the real alarms are not touched.

## Consequences

- Depends on one outside service and its free plan; the Pi and the API need internet access for the reading, the ping needs it too.
- Samuel creates the account, the check, the ntfy subscription and the read-only key himself and keeps the secrets locally.
- The notification only helps if the phone allows push messages from ntfy, also at night.
- A Pi that is down for several days is covered: the check stays silent and the phone is notified (ADR-021).
- The ping says Home Assistant is running, not that the alarms will ring. The backup alarm (ADR-020) stays the safety net.
- Replaces the open point "service is chosen during the build" in ADR-021.
