import { randomBytes } from 'node:crypto'
import Fastify from 'fastify'
import { parseAlarmInput, type Alarm } from './alarm.ts'
import { CalendarImporter, httpFetcher } from './calendar.ts'
import { configIdFor, fromAutomation, toAutomation } from './automation.ts'
import { HaUnreachableError, type HaClient } from './ha.ts'
import { SOURCES, ZONES } from './mapping.ts'
import { NoProbe, type Probe, type SystemStatus } from './probe.ts'
import { applySettings, installBlockedUntil, parseSettingsPatch, readSettings, SettingsStore } from './settings.ts'
import * as status from './status.ts'
import { pendingUpdates } from './updates.ts'
import { NoWatchdog, type Watchdog } from './watchdog.ts'

// `now` can be swapped in tests, so "next alarm" does not depend on the real clock.
export function buildApp(ha: HaClient, now: () => Date = () => new Date(), probe: Probe = new NoProbe(),
  calendar: CalendarImporter = new CalendarImporter([], httpFetcher, undefined),
  settings: SettingsStore = new SettingsStore(undefined),
  watchdog: Watchdog = new NoWatchdog(),
) {
  const app = Fastify({ logger: false })

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HaUnreachableError) return reply.code(502).send({ error: 'ha_unreachable' })
    console.error(err)
    return reply.code(500).send({ error: 'internal_error' })
  })

  async function listAlarms(): Promise<Alarm[]> {
    const alarms: Alarm[] = []
    for (const a of await ha.listAppAutomations()) {
      const alarm = fromAutomation(a.config, a.on)
      if (alarm) alarms.push(alarm)
    }
    return alarms.sort((x, y) => x.time.localeCompare(y.time))
  }

  async function findAlarm(id: string): Promise<Alarm | undefined> {
    return (await listAlarms()).find((a) => a.id === id)
  }

  // Saving rewrites the config and then sets on/off explicitly, so the switch
  // never depends on what Home Assistant remembers from the old version.
  async function store(alarm: Alarm, isNew: boolean) {
    const configId = configIdFor(alarm.id)
    await ha.saveAutomation(configId, toAutomation(alarm))
    try {
      await ha.setAutomationEnabled(configId, alarm.on)
    } catch (err) {
      // A new alarm whose switch could not be set would ring although Samuel may
      // have saved it as off; remove it so the failed save leaves nothing behind.
      if (isNew) await ha.deleteAutomation(configId).catch(() => undefined)
      throw err
    }
  }

  app.get('/api/alarms/options', async () => ({ zones: Object.keys(ZONES), sources: Object.keys(SOURCES) }))

  app.get('/api/alarms', async () => listAlarms())

  app.post('/api/alarms', async (req, reply) => {
    const parsed = parseAlarmInput(req.body)
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error })
    const alarm: Alarm = { id: randomBytes(6).toString('hex'), ...parsed.value }
    await store(alarm, true)
    return reply.code(201).send(alarm)
  })

  app.put<{ Params: { id: string } }>('/api/alarms/:id', async (req, reply) => {
    const parsed = parseAlarmInput(req.body)
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error })
    if (!(await findAlarm(req.params.id))) return reply.code(404).send({ error: 'not_found' })
    const alarm: Alarm = { id: req.params.id, ...parsed.value }
    await store(alarm, false)
    return alarm
  })

  app.patch<{ Params: { id: string }; Body: { on?: unknown } }>('/api/alarms/:id', async (req, reply) => {
    if (typeof req.body?.on !== 'boolean') return reply.code(400).send({ error: 'on must be true or false' })
    const alarm = await findAlarm(req.params.id)
    if (!alarm) return reply.code(404).send({ error: 'not_found' })
    await ha.setAutomationEnabled(configIdFor(alarm.id), req.body.on)
    return { ...alarm, on: req.body.on }
  })

  app.delete<{ Params: { id: string } }>('/api/alarms/:id', async (req, reply) => {
    if (!(await findAlarm(req.params.id))) return reply.code(404).send({ error: 'not_found' })
    await ha.deleteAutomation(configIdFor(req.params.id))
    return reply.code(204).send()
  })

  // Read-only status for the overview (admin) and the morning screen (TV).
  app.get('/api/status/next-alarm', async () => {
    const [alarms, states] = await Promise.all([listAlarms(), ha.getStates()])
    return { alarm: await status.nextAlarm(ha, alarms, states, now()) }
  })
  app.get('/api/status/backup-alarm', async () => status.backupAlarm(await ha.getStates()))
  app.get('/api/status/tv', async () => status.tvStatus(await ha.getStates()))
  app.get('/api/status/weather', async () => status.weather(ha, await ha.getStates(), now()))
  app.get('/api/status/player', async () => status.player(await ha.getStates(), now()))
  app.get('/api/status/connections', async () => ({ connections: status.connections(await ha.listConfigEntries()) }))
  app.get('/api/status/last-backup', async () => status.lastBackup(await ha.getStates()))
  // Pi values come from the probe program on the Pi; Home Assistant only says whether it answers.
  // Neither being down is an error here: the page shows what is missing.
  app.get('/api/status/system', async (): Promise<SystemStatus> => {
    const [reading, homeAssistant] = await Promise.all([
      probe.read(),
      ha.getStates().then(
        () => true,
        () => false,
      ),
    ])
    return { probe: reading !== null, reading, homeAssistant }
  })

  // Activity feed (ADR-030): our own lines from the Home Assistant logbook, newest first. Kept for
  // 10 days like the recorder; the answer is cached for 30 s because the card polls.
  let feedCache: { at: number; entries: Awaited<ReturnType<HaClient['getLogbook']>> } | undefined
  app.get<{ Querystring: { limit?: string } }>('/api/status/activity', async (req) => {
    const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit ?? 20)) || 20))
    if (!feedCache || now().getTime() - feedCache.at > 30_000) {
      feedCache = { at: now().getTime(), entries: await ha.getLogbook(new Date(now().getTime() - 10 * 86400000)) }
    }
    return { entries: status.activity(feedCache.entries, limit) }
  })

  // Watchdog (ADR-032): when the last check-in reached Healthchecks.io. Always answers, so the
  // page can say "unknown" instead of failing.
  app.get('/api/status/watchdog', async () => watchdog.read())

  // Settings (ADR-029): Home Assistant helpers plus the default volume kept here.
  const loadSettings = async () => {
    const [states, alarms] = await Promise.all([ha.getStates(), listAlarms()])
    return readSettings(settings, states, alarms, now())
  }
  app.get('/api/settings', loadSettings)
  app.patch('/api/settings', async (req, reply) => {
    const parsed = parseSettingsPatch(req.body)
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error })
    await applySettings(ha, settings, parsed.value)
    return loadSettings()
  })

  // Updates (ADR-018, ADR-019): Home Assistant's own update entities; Samuel confirms each install.
  // `blockedUntil` is set inside the night window, when nothing may be installed.
  app.get('/api/status/updates', async () => {
    const [states, alarms] = await Promise.all([ha.getStates(), listAlarms()])
    return { updates: pendingUpdates(states), blockedUntil: installBlockedUntil(alarms, states, now()) }
  })
  app.post<{ Params: { id: string } }>('/api/updates/:id/install', async (req, reply) => {
    const [states, alarms] = await Promise.all([ha.getStates(), listAlarms()])
    const update = pendingUpdates(states).find((u) => u.id === req.params.id)
    if (!update) return reply.code(404).send({ error: 'not_found' })
    if (update.inProgress) return reply.code(409).send({ error: 'already_running' })
    const until = installBlockedUntil(alarms, states, now())
    if (until) return reply.code(409).send({ error: 'install_window', until })
    try {
      await ha.callService('update', 'install', { entity_id: update.id })
    } catch (err) {
      // Installing Home Assistant itself restarts it, so the call may never get an answer.
      // Home Assistant answered a moment ago, so this counts as started.
      if (!(err instanceof HaUnreachableError)) throw err
    }
    return reply.code(202).send({ started: true })
  })

  // Calendars (ADR-028). Reading is open to the TV and the admin app; the links never appear here.
  app.get<{ Querystring: { days?: string } }>('/api/status/calendar', async (req) => {
    const days = Math.min(14, Math.max(1, Math.floor(Number(req.query.days ?? 7)) || 7))
    return calendar.status(now(), days)
  })
  app.patch<{ Params: { id: string }; Body: { on?: unknown } }>('/api/calendar/calendars/:id', async (req, reply) => {
    if (typeof req.body?.on !== 'boolean') return reply.code(400).send({ error: 'on must be true or false' })
    if (!calendar.hasCalendar(req.params.id)) return reply.code(404).send({ error: 'not_found' })
    calendar.setCalendarOn(req.params.id, req.body.on)
    return calendar.calendars().find((c) => c.id === req.params.id)
  })
  // One switch per calendar id + UID, so it covers a single event or a whole series.
  app.patch<{ Body: { calendarId?: unknown; uid?: unknown; shown?: unknown } }>('/api/calendar/events', async (req, reply) => {
    const { calendarId, uid, shown } = req.body ?? {}
    if (typeof calendarId !== 'string' || typeof uid !== 'string' || uid === '' || typeof shown !== 'boolean') {
      return reply.code(400).send({ error: 'calendarId, uid and shown are required' })
    }
    if (!calendar.hasCalendar(calendarId)) return reply.code(404).send({ error: 'not_found' })
    calendar.setEventShown(`${calendarId}:${uid}`, shown)
    return reply.code(204).send()
  })

  return app
}
