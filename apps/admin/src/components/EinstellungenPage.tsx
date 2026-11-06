import { useState } from 'react'
import Icon from './Icon'
import { connections, settingsDefaults as d } from '../mockData'
import './EinstellungenPage.css'

export default function EinstellungenPage() {
  const [skipHolidays, setSkipHolidays] = useState(d.skipHolidays)

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
          <div className="set-line">
            <span>Zeitzone</span>
            <span className="val">{d.timeZone}</span>
          </div>
          <div className="set-line">
            <span>Feiertage St. Gallen überspringen</span>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={skipHolidays}
              aria-label="Feiertage St. Gallen überspringen"
              onClick={() => setSkipHolidays((v) => !v)}
            >
              <i />
            </button>
          </div>
          <div className="set-line">
            <span>Standard-Lautstärke für neue Wecker</span>
            <span className="val">{d.defaultVolume}</span>
          </div>
          <div className="set-line">
            <span>
              Morgenbildschirm höchstens
              <small>Weniger, wenn du das Haus verlässt</small>
            </span>
            <span className="val">{d.morningScreenMaxMinutes} Min.</span>
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
            <span className="val">{d.updateNotice}</span>
          </div>
          <div className="set-line">
            <span>
              Sperrzeit für Installationen <span className="tag">nur lesen</span>
              <small>Ab 21:00 bis 2 Std. nach dem letzten Wecker</small>
            </span>
            <span className="val">{d.installWindow}</span>
          </div>
        </section>
      </div>
    </main>
  )
}
