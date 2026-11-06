# ADR-020: One Sonos alarm is used as the backup alarm

- Status: Accepted
- Date: 2026-11-03

## Context

Samuel's choice on 3 Nov 2026, instead of a phone backup. Sonos alarms are stored on the speaker and fall back to the chime when the music source fails. Home Assistant can change existing Sonos alarms but not create them.

## Decision

One Sonos alarm is created in the Sonos app and used as the backup. Sonos alarms have no names, so Home Assistant finds it by its internal ID and labels it "Backup". Every evening it is set to 10 minutes after the next alarm on the same zone and switched on. After the Home Assistant alarm is stopped, Home Assistant switches it off for that morning.

## Consequences

The backup alarm repeats "Daily" in the Sonos app (Samuel's choice on 6 Nov 2026; Home Assistant cannot change the repeat setting). If Home Assistant is down for days, it keeps ringing every day at its last time instead of once. Home Assistant switches it off on days without a working alarm.

Fail-safe: the backup is on by default and only a working Home Assistant can switch it off. Only this one alarm is changed, once a day, because changing several at once is unreliable. Never match it by name and never create a second one.
