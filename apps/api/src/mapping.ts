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
