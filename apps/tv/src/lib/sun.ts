import type { ZurichNow } from './time'

export type Scene = 'sunrise' | 'noon' | 'sunset' | 'midnight'
export const SCENES: Scene[] = ['sunrise', 'noon', 'sunset', 'midnight']

const PLACE = { lat: 47.424, lon: 9.377 } // St. Gallen
// Sunrise scene runs until 90 min after sunrise; sunset scene starts 90 min before sunset.
const GLOW = 90 * 60000

// Solar times for one day (standard sunrise equation, accurate to about a minute).
function sunTimes(dayNoonUtc: number, lat: number, lon: number) {
  const RAD = Math.PI / 180
  const DAY = 86400000
  const J1970 = 2440588
  const J2000 = 2451545
  const J0 = 0.0009
  const d = dayNoonUtc / DAY - 0.5 + J1970 - J2000
  const lw = -lon * RAD
  const phi = lat * RAD
  const n = Math.round(d - J0 - lw / (2 * Math.PI))
  const ds = J0 + lw / (2 * Math.PI) + n
  const M = RAD * (357.5291 + 0.98560028 * ds)
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M))
  const L = M + C + RAD * 102.9372 + Math.PI
  const dec = Math.asin(Math.sin(RAD * 23.4397) * Math.sin(L))
  const jNoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
  const toMs = (j: number) => (j + 0.5 - J1970) * DAY
  const at = (alt: number) => {
    const w = Math.acos((Math.sin(alt * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)))
    const jSet = J2000 + (J0 + (w + lw) / (2 * Math.PI) + n) + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
    return { rise: toMs(jNoon - (jSet - jNoon)), set: toMs(jSet) }
  }
  const horizon = at(-0.833)
  const civil = at(-6)
  return { dawn: civil.rise, sunrise: horizon.rise, sunset: horizon.set, dusk: civil.set }
}

export function sceneFor(n: ZurichNow, nowMs = Date.now()): Scene {
  const sun = sunTimes(Date.UTC(n.y, n.m - 1, n.d, 12), PLACE.lat, PLACE.lon)
  if (nowMs < sun.dawn) return 'midnight'
  if (nowMs < sun.sunrise + GLOW) return 'sunrise'
  if (nowMs < sun.sunset - GLOW) return 'noon'
  if (nowMs < sun.dusk) return 'sunset'
  return 'midnight'
}
