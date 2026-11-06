// Names shown in the app mapped to Home Assistant. Entity ids and playlist ids
// are not secrets; they already live in homeassistant/scripts/alarm_ring.yaml.
// Keep both in step: this is the only place that knows them for app-made alarms.

export const ZONES: Record<string, string> = {
  'Wohnzimmer-Gruppe': 'media_player.kinderzimmer_kinderzimmer',
  // Open (see handoff): check whether "Schlafzimmer" is a real Sonos player and
  // give it its own entity. Until then it plays on the group's player.
  Schlafzimmer: 'media_player.kinderzimmer_kinderzimmer',
}

export const SOURCES: Record<string, string> = {
  'Discover Weekly': 'spotify:playlist:37i9dQZF1E8N3mKFwU3tJ8',
}

export const labelForValue = (map: Record<string, string>, value: unknown): string | undefined =>
  Object.keys(map).find((label) => map[label] === value)

// What the read-only status routes look at. Like the zones above, these must
// stay in step with homeassistant/ (the 06:30 weekday alarm and the Sonos backup).
export const WEEKDAY_ALARM = {
  entity: 'automation.alarm_mon_fri_06_30',
  time: '06:30',
  days: [0, 1, 2, 3, 4],
}

export const BACKUP_ALARM = {
  // The Sonos alarm id from homeassistant/scripts/alarm_backup.yaml. Found by id,
  // never by name (ADR-020).
  sonosAlarmId: '980',
  minutesAfter: 10,
  syncAutomation: 'automation.alarm_backup_sync_21_00',
}

export const ENTITIES = {
  tv: 'media_player.schlafzimmer_samueltv',
  tvRemote: 'remote.schlafzimmer_samueltv',
  weather: 'weather.home',
  player: 'media_player.kinderzimmer_kinderzimmer',
  backupLastSuccess: 'sensor.backup_last_successful_automatic_backup',
  backupLastAttempt: 'sensor.backup_last_attempted_automatic_backup',
  backupNext: 'sensor.backup_next_scheduled_automatic_backup',
  backupState: 'sensor.backup_backup_manager_state',
}

export const PLACE = 'St. Gallen'
