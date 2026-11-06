import type { Alarm } from './alarm.ts'
import { labelForValue, SOURCES, ZONES } from './mapping.ts'

// One alarm = one Home Assistant automation (ADR-025).
export const ID_PREFIX = 'app_alarm_'
export const configIdFor = (alarmId: string) => ID_PREFIX + alarmId
export const alarmIdFrom = (configId: string) => configId.slice(ID_PREFIX.length)

// Home Assistant's weekday names in our order, 0 = Mo.
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// Public holidays are skipped Mon-Fri only: the Workday sensor is off on every
// weekend, so asking it on Saturday would silence every weekend alarm (ADR-012,
// ADR-025). If the sensor is unavailable on a weekday the alarm stays silent and
// the Sonos backup alarm wakes Samuel, same as the hand-written alarm.
// "Ring on public holidays" (ADR-029) lets the alarm ring on a Mon-Fri holiday.
const HOLIDAY_CHECK =
  "{{ now().weekday() >= 5 or is_state('input_boolean.ring_on_holidays', 'on') or is_state('binary_sensor.workday_sensor_ch_sg', 'on') }}"

export type AutomationConfig = Record<string, unknown>

export function toAutomation(alarm: Alarm): AutomationConfig {
  return {
    id: configIdFor(alarm.id),
    alias: `Wecker ${alarm.time}`,
    description: 'Made by the management web app (ADR-025). Change it there, not here.',
    mode: 'single',
    triggers: [{ trigger: 'time', at: `${alarm.time}:00` }],
    conditions: [
      { condition: 'time', weekday: alarm.days.map((d) => WEEKDAYS[d]) },
      { condition: 'template', value_template: HOLIDAY_CHECK },
    ],
    actions: [
      {
        action: 'script.alarm_ring',
        data: {
          zone_entity: ZONES[alarm.zone],
          playlist_uri: SOURCES[alarm.source],
          volume_level: alarm.volume / 100,
          wake_tv: alarm.wakeTv,
        },
      },
    ],
  }
}

type Loose = any

// Reads back only the exact shape toAutomation writes. Anything else (an
// automation edited by hand in Home Assistant) returns null and is left alone.
export function fromAutomation(config: AutomationConfig, on: boolean): Alarm | null {
  const c: Loose = config
  const id = c.id
  if (typeof id !== 'string' || !id.startsWith(ID_PREFIX)) return null

  const at = c.triggers?.[0]?.at
  const weekday = c.conditions?.[0]?.weekday
  const data = c.actions?.[0]?.data
  if (typeof at !== 'string' || !/^\d\d:\d\d:00$/.test(at)) return null
  if (!Array.isArray(weekday) || !data) return null

  const days = weekday.map((w: string) => WEEKDAYS.indexOf(w))
  const zone = labelForValue(ZONES, data.zone_entity)
  const source = labelForValue(SOURCES, data.playlist_uri)
  const volume = Math.round(Number(data.volume_level) * 100)
  if (days.length === 0 || days.includes(-1) || !zone || !source) return null
  if (!Number.isInteger(volume) || typeof data.wake_tv !== 'boolean') return null

  return { id: alarmIdFrom(id), time: at.slice(0, 5), days, zone, source, volume, wakeTv: data.wake_tv, on }
}
