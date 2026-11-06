import Icon from './Icon'
import { systemPage as s } from '../mockData'
import './SystemPage.css'

const TEMP_WARN = 70
const DISK_WARN = 90

function Meter({ label, value, text, detail, warn }: { label: string; value: number; text: string; detail?: string; warn?: boolean }) {
  return (
    <div className="meter">
      <small>{label}</small>
      <b className="tabular">{text}</b>
      <div className={`bar${warn ? ' warn' : ''}`} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      {detail && <em>{detail}</em>}
    </div>
  )
}

function Status({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <span className={`status${ok ? '' : ' bad'}`}>
      <i />
      {ok ? okText : badText}
    </span>
  )
}

export default function SystemPage() {
  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / System</div>
          <h1>Alles im Blick.</h1>
          <p className="lede">Nur Anzeige: Backup-Wecker, Watchdog, Raspberry Pi und das letzte Backup.</p>
        </div>
      </div>

      <div className="sys-grid">
        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="shield" />
              Backup-Wecker
              <span className="tag">nur lesen</span>
            </span>
            <Status ok={s.backupAlarm.on} okText="Eingeschaltet" badText="Ausgeschaltet" />
          </div>
          <div className="big tabular">{s.backupAlarm.time}</div>
          <dl>
            <dt>Zone</dt>
            <dd>{s.backupAlarm.zone}</dd>
            <dt>Abstand</dt>
            <dd>{s.backupAlarm.offset}</dd>
            <dt>Letzter Abgleich</dt>
            <dd>{s.backupAlarm.lastSync}</dd>
          </dl>
          <div className="hint">
            <Icon name="info" />
            Wird jede Nacht an den nächsten Wecker angepasst.
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="activity" />
              Watchdog
            </span>
            <Status ok={s.watchdog.ok} okText="OK" badText="Keine Meldung" />
          </div>
          <div className="big tabular">{s.watchdog.lastCheckIn}</div>
          <dl>
            <dt>Letzte Meldung</dt>
            <dd>vor {s.watchdog.agoSeconds} Sek.</dd>
            <dt>Externer Dienst</dt>
            <dd>{s.watchdog.externalReached ? 'erreicht' : 'nicht erreicht'}</dd>
          </dl>
          <div className="hint">
            <Icon name="info" />
            Bleibt die Meldung aus, kommt eine Warnung aufs Handy.
          </div>
        </section>

        <section className="card wide">
          <div className="card-head">
            <span className="label">
              <Icon name="cpu" />
              Raspberry Pi
              <span className="tag">{s.pi.name}</span>
            </span>
            <Status ok={s.pi.online} okText="Online" badText="Offline" />
          </div>
          <div className="meters">
            <Meter label="CPU-Auslastung" value={s.pi.cpuPercent} text={`${s.pi.cpuPercent} %`} />
            <Meter label="Temperatur" value={s.pi.tempC} text={`${s.pi.tempC} °C`} warn={s.pi.tempC > TEMP_WARN} />
            <Meter label="Arbeitsspeicher" value={s.pi.memoryPercent} text={`${s.pi.memoryPercent} %`} detail={s.pi.memoryDetail} />
            <Meter
              label="SSD-Speicher"
              value={s.pi.diskPercent}
              text={`${s.pi.diskPercent} %`}
              detail={s.pi.diskDetail}
              warn={s.pi.diskPercent > DISK_WARN}
            />
          </div>
          <dl>
            <dt>Laufzeit</dt>
            <dd>{s.pi.uptime}</dd>
            <dt>Netzwerk</dt>
            <dd>{s.pi.network}</dd>
            <dt>Home Assistant</dt>
            <dd>{s.pi.homeAssistant}</dd>
          </dl>
          <div className="hint">
            <Icon name="info" />
            Bei Temperatur über {TEMP_WARN} °C oder SSD über {DISK_WARN} % wird der Balken rot.
          </div>
        </section>

        <section className={`card wide${s.lastBackup.ok ? '' : ' card-bad'}`}>
          <div className="card-head">
            <span className="label">
              <Icon name="list" />
              Letztes nächtliches Backup
            </span>
            <Status ok={s.lastBackup.ok} okText="Erfolgreich" badText="Fehlgeschlagen" />
          </div>
          <div className="big tabular">{s.lastBackup.time}</div>
          <dl>
            <dt>Zeitpunkt</dt>
            <dd>{s.lastBackup.when}</dd>
            <dt>Ergebnis</dt>
            <dd>{s.lastBackup.ok ? 'Erfolgreich' : s.lastBackup.error}</dd>
          </dl>
          <div className="hint">
            <Icon name="info" />
            Bei einem Fehler wird die Karte rot und zeigt den Grund.
          </div>
        </section>
      </div>
    </main>
  )
}
