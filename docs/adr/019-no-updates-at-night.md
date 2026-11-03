# ADR-019: No updates at night

- Status: Accepted
- Date: 2026-11-03

## Context

Samuel's choice on 3 Nov 2026. An update that breaks something can never hit an alarm, and Samuel can check the result when he is home, with the evening left to fix it. The alarm is not optional, so nothing installs at night.

## Decision

From 21:00 until 2 hours after the last alarm a confirmed update is queued and installed 2 hours after the last alarm of the next day. On a day without an alarm, queued updates run at 10:00. Updates are announced daily at 21:00.

## Consequences

The result of a queued update goes to the phone.
