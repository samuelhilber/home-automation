import { useState } from 'react'
import Icon from './Icon'
import { connections as mockConnections, type Connection } from '../mockData'
import { describeError, settingsApi, statusApi, type Settings } from '../api'
import { useStatus } from '../useStatus'
import './EinstellungenPage.css'

// The lines Home Assistant knows about; their state comes from the api. The buttons stay off until
// the backend can connect and disconnect accounts.
const LIVE: Record<string, Pick<Connection, 'name' | 'detail' | 'value'> & { down?: string }> = {
  spotify: { name: 'Spotify', detail: 'Quelle für die Wecker' },
  sonos: { name: 'Sonos', value: 'verbunden' },
  tv: { name: 'Sony-TV (Bravia)', down: 'Nicht erreichbar' },
  ha: { name: 'Home Assistant', value: 'läuft' },
}
// Display order, mixing live and placeholder lines.
const ORDER = ['icloud', 'work', 'school', 'spotify', 'sonos', 'tv', 'ha', 'tailscale', 'watchdog']

function mergeConnections(live: { id: string; state: Connection['state'] }[] | undefined): Connection[] {
  const byId = new Map<string, Connection>(mockConnections.map((c) => [c.id, c]))
  // Until the api answers (or if it cannot), the live lines show as unknown rather than vanish.
  for (const id of Object.keys(LIVE)) byId.set(id, { id, name: LIVE[id].name, state: 'none', detail: 'Status unbekannt' })
  for (const l of live ?? []) {
    const meta = LIVE[l.id]
    if (!meta) continue
    byId.set(l.id, {
      id: l.id,
      name: meta.name,
      state: l.state,
      detail: l.state === 'down' ? (meta.down ?? 'Nicht erreichbar') : l.state === 'none' ? 'Nicht eingerichtet' : meta.detail,
      value: l.state === 'ok' ? meta.value : undefined,
    })
  }
  return ORDER.flatMap((id) => byId.get(id) ?? [])
}

export default function EinstellungenPage() {
  const { data: live } = useStatus(statusApi.connections)
  const connections = mergeConnections(live)
  const { data: liveSettings } = useStatus(settingsApi.get)
  // The answer to our own change, shown until the next refresh brings the same values.
  const [saved, setSaved] = useState<{ base: Settings | undefined; value: Settings } | undefined>()
  const [saveError, setSaveError] = useState<string | null>(null)
  const s = saved && saved.base === liveSettings ? saved.value : liveSettings
  const dash = '–' // Home Assistant does not answer or the helper is missing

  async function toggleHolidays() {
    if (s?.skipHolidays == null) return
    setSaveError(null)
    try {
      setSaved({ base: liveSettings, value: await settingsApi.update({ skipHolidays: !s.skipHolidays }) })
    } catch (err) {
      setSaveError(describeError(err))
    }
  }

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Einstellungen</div>
          <h1>Alles eingestellt.</h1>
          <p className="lede">Nur Status, keine Passwörter, Schlüssel oder Adressen.</p>
        </div>
      </div>

      <div className="set-stack">
        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="sliders" />
              Verbundene Konten und Geräte
            </span>
          </div>
          <p className="set-desc">Die Kalender-Schalter bleiben unter „Kalender-Import“.</p>
          {connections.map((c) => (
            <div key={c.id} className="set-line">
              <span>
                <i className={`dot ${c.state}`} aria-hidden="true" />
                {c.name}
                {c.detail && <small>{c.detail}</small>}
              </span>
              {c.value && <span className="val">{c.value}</span>}
              {c.action && (
                <button
                  type="button"
                  className={`btn small${c.state === 'none' ? '' : ' ghost'}`}
                  disabled
                  title="Gibt es erst mit dem Backend"
                >
                  {c.action}
                </button>
              )}
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-head">
            <span className="label">Standardwerte</span>
          </div>
          {saveError && (
            <p className="set-desc" role="alert">
              {saveError}
            </p>
          )}
          <div className="set-line">
            <span>Zeitzone</span>
            <span className="val">{s?.timeZone ?? 'Europe/Zurich'}</span>
          </div>
          <div className="set-line">
            <span>Feiertage St. Gallen überspringen</span>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={s?.skipHolidays ?? false}
              aria-label="Feiertage St. Gallen überspringen"
              disabled={s?.skipHolidays == null}
              onClick={toggleHolidays}
            >
              <i />
            </button>
          </div>
          <div className="set-line">
            <span>Standard-Lautstärke für neue Wecker</span>
            <span className="val">{s?.defaultVolume ?? dash}</span>
          </div>
          <div className="set-line">
            <span>
              Morgenbildschirm höchstens
              <small>Weniger, wenn du das Haus verlässt</small>
            </span>
            <span className="val">{s?.morningScreenMaxMinutes == null ? dash : `${s.morningScreenMaxMinutes} Min.`}</span>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <span className="label">Benachrichtigungen und Updates</span>
          </div>
          <div className="set-line">
            <span>
              Tägliche Meldung über wartende Updates
              <small>aufs Handy</small>
            </span>
            <span className="val">{s?.updateNotice ?? dash}</span>
          </div>
          <div className="set-line">
            <span>
              Sperrzeit für Installationen <span className="tag">nur lesen</span>
              <small>Ab 21:00 bis 2 Std. nach dem letzten Wecker</small>
            </span>
            <span className="val">{s ? `${s.installWindow.from}–${s.installWindow.to}` : dash}</span>
          </div>
        </section>
      </div>
    </main>
  )
}
