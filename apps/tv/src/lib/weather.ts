// Home Assistant weather conditions -> German text and one of the icons in the sprite.
const CONDITIONS: Record<string, { icon: string; text: string }> = {
  sunny: { icon: 'sun', text: 'Sonnig' },
  'clear-night': { icon: 'sun', text: 'Klar' },
  partlycloudy: { icon: 'cloud-sun', text: 'Teils bewölkt' },
  cloudy: { icon: 'cloud', text: 'Bedeckt' },
  fog: { icon: 'cloud', text: 'Nebel' },
  rainy: { icon: 'rain', text: 'Regen' },
  pouring: { icon: 'rain', text: 'Starkregen' },
  'lightning-rainy': { icon: 'rain', text: 'Gewitter' },
  lightning: { icon: 'rain', text: 'Gewitter' },
  hail: { icon: 'rain', text: 'Hagel' },
  snowy: { icon: 'cloud', text: 'Schnee' },
  'snowy-rainy': { icon: 'rain', text: 'Schneeregen' },
  windy: { icon: 'cloud', text: 'Windig' },
  'windy-variant': { icon: 'cloud-sun', text: 'Windig' },
}

export const describeCondition = (condition: string | null) =>
  (condition && CONDITIONS[condition]) || { icon: 'cloud', text: condition ?? '–' }
