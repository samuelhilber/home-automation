// Placeholder values, matching the signed-off prototype. No backend yet (see docs/HANDOFF.md).

export const weather = {
  place: 'St. Gallen',
  source: 'MeteoSchweiz',
  icon: 'cloud',
  tempC: 12,
  condition: 'Bedeckt',
  windKmh: 18,
  rainPercent: 40,
  humidityPercent: 78,
  feelsLikeC: 9,
}

// One entry per day starting tomorrow; the weekday labels are computed.
export const forecast = [
  { icon: 'cloud-sun', hi: 14, lo: 9 },
  { icon: 'rain', hi: 10, lo: 6 },
  { icon: 'rain', hi: 9, lo: 5 },
  { icon: 'cloud-sun', hi: 13, lo: 7 },
  { icon: 'sun', hi: 17, lo: 9 },
  { icon: 'sun', hi: 19, lo: 11 },
  { icon: 'cloud-sun', hi: 15, lo: 8 },
]

// Offsets from today (0 = today) that get an event marker in the week strip.
export const eventDayOffsets = [2, 5]

export type Hour = { h: number; bar?: { text: string; style?: 'grey' | 'outline'; maxWidth?: string } }
export const hours: Hour[] = [
  { h: 8, bar: { text: 'Stand-up Meeting' } },
  { h: 9 },
  { h: 10, bar: { text: 'Projektreview', style: 'grey' } },
  { h: 11 },
  { h: 12, bar: { text: 'Mittagspause', style: 'outline' } },
  { h: 13 },
  { h: 14, bar: { text: 'Design Sync' } },
  { h: 15 },
  { h: 16 },
  { h: 17, bar: { text: 'Feierabend ✓', style: 'outline', maxWidth: '62%' } },
]

export const player = {
  playing: true,
  song: 'Blinding Lights',
  artist: 'The Weeknd',
  playlist: 'Lo-Fi Chill Vibes Mix',
  elapsed: '2:14',
  total: '3:22',
  progressPercent: 66,
}
