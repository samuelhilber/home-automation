// Placeholder values for what the backend cannot deliver yet (calendar events). Weather and the player
// come from apps/api (see lib/api.ts).

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
