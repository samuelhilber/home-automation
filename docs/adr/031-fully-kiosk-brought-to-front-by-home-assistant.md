# ADR-031: Home Assistant brings Fully Kiosk to the front after the TV wakes

- Status: Accepted
- Date: 2026-11-06

## Context

ADR-006 chose Fully Kiosk for the morning screen and ADR-022 has it load its pages from the Pi. ADR-015 keeps the normal Google TV home screen in 1.0, so no launcher starts Fully Kiosk. The wake command (`script.tv_command`, ADR-011) only brings the TV out of standby through the Bravia integration. After waking, the TV shows the home screen or the last app, not the morning screen.

Samuel has bought Fully Kiosk Plus, which includes Remote Admin (a small REST interface in the app). Home Assistant has an official "Fully Kiosk Browser" integration that uses it.

## Decision

After the TV is awake, `tv_command wake` presses two buttons of the Fully Kiosk Browser integration: bring the app to the front and load its start page. It retries for up to one minute, because the app may not answer right after the wake. The step is skipped while the integration does not exist and never stops the alarm.

The Remote Admin password lives in the integration in Home Assistant, not in YAML or in the repo. The TV needs a fixed address (DHCP reservation).

## Consequences

- Needs Fully Kiosk Plus on the TV and a working network path from the Pi to the TV.
- If Google TV ends Fully Kiosk in standby, the app does not answer and the morning screen does not appear. Fallbacks, to be decided if that happens: start the app through the Bravia source list (`media_player.select_source`), or through ADB or the Android TV Remote integration.
- The change stays in the one TV script, as required by the rule that all TV commands go through one place.
- Tested on 2026-11-06: `tv_command wake` from the HA actions page woke the TV and the morning screen appeared. Not yet tested through a real alarm run.
