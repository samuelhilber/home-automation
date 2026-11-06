import Icon from './Icon'
import { systemPage as s } from '../mockData'
import { statusApi } from '../api'
import { clockOf, gbLabel, uptimeLabel, whenLabel } from '../format'
import { useStatus } from '../useStatus'
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
  const { data: backup, loaded: backupLoaded } = useStatus(statusApi.backupAlarm)
  const { data: last, loaded: lastLoaded } = useStatus(statusApi.lastBackup)
  const { data: sys, loaded: sysLoaded } = useStatus(statusApi.system)
  const pi = sys?.reading ?? null
  const dash = sysLoaded ? '–' : 'Lädt …'
  const lastOk = last?.ok !== false
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
            {backup && <Status ok={backup.on} okText="Eingeschaltet" badText="Ausgeschaltet" />}
          </div>
          <div className="big tabular">{backup?.time ?? '–'}</div>
          <dl>
            <dt>Abstand</dt>
            <dd>{backup ? `${backup.minutesAfter} Min. nach Hauptwecker` : backupLoaded ? 'nicht gefunden' : 'Lädt …'}</dd>
            <dt>Abgleich 21:00</dt>
            <dd>{backup ? (backup.syncEnabled ? 'eingeschaltet' : 'ausgeschaltet') : '–'}</dd>
            <dt>Letzter Abgleich</dt>
            <dd>{backup?.lastSync ? whenLabel(backup.lastSync) : '–'}</dd>
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
            </span>
            {sys && <Status ok={sys.probe} okText="Online" badText="Keine Messwerte" />}
          </div>
          <div className="meters">
            <Meter label="CPU-Auslastung" value={pi?.cpuPercent ?? 0} text={pi ? `${pi.cpuPercent} %` : '–'} />
            <Meter
              label="Temperatur"
              value={pi?.tempC ?? 0}
              text={pi?.tempC != null ? `${Math.round(pi.tempC)} °C` : '–'}
              warn={(pi?.tempC ?? 0) > TEMP_WARN}
            />
            <Meter
              label="Arbeitsspeicher"
              value={pi?.memory.percent ?? 0}
              text={pi ? `${pi.memory.percent} %` : '–'}
              detail={pi ? `${gbLabel(pi.memory.usedMb / 1000)} von ${gbLabel(Math.round(pi.memory.totalMb / 1000))}` : undefined}
            />
            <Meter
              label="SSD-Speicher"
              value={pi?.disk.percent ?? 0}
              text={pi ? `${pi.disk.percent} %` : '–'}
              detail={pi ? `${gbLabel(pi.disk.usedGb)} von ${gbLabel(pi.disk.totalGb)}` : undefined}
              warn={(pi?.disk.percent ?? 0) > DISK_WARN}
            />
          </div>
          <dl>
            <dt>Laufzeit</dt>
            <dd>{pi ? uptimeLabel(pi.uptimeSeconds) : dash}</dd>
            <dt>Netzwerk</dt>
            <dd>{pi ? (pi.internet.reachable ? `Internet erreichbar (${pi.internet.latencyMs} ms)` : 'Kein Internet') : dash}</dd>
            <dt>Home Assistant</dt>
            <dd>{sys ? (sys.homeAssistant ? 'antwortet' : 'antwortet nicht') : dash}</dd>
          </dl>
          <div className="hint">
            <Icon name="info" />
            Bei Temperatur über {TEMP_WARN} °C oder SSD über {DISK_WARN} % wird der Balken rot.
          </div>
        </section>

        <section className={`card wide${lastOk ? '' : ' card-bad'}`}>
          <div className="card-head">
            <span className="label">
              <Icon name="list" />
              Letztes nächtliches Backup
            </span>
            {last && (last.ok === null ? <span className="tag">Noch keins</span> : <Status ok={last.ok} okText="Erfolgreich" badText="Fehlgeschlagen" />)}
          </div>
          <div className="big tabular">{last?.lastSuccess ? clockOf(last.lastSuccess) : '–'}</div>
          <dl>
            <dt>Letztes erfolgreiches</dt>
            <dd>{last?.lastSuccess ? whenLabel(last.lastSuccess) : lastLoaded ? 'noch keins' : 'Lädt …'}</dd>
            <dt>Ergebnis</dt>
            <dd>
              {last?.ok === true && 'Erfolgreich'}
              {last?.ok === false && 'Der letzte Versuch ist fehlgeschlagen'}
              {last?.ok === null && 'Noch kein automatisches Backup gelaufen'}
            </dd>
            <dt>Nächstes</dt>
            <dd>{last?.next ? whenLabel(last.next) : '–'}</dd>
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
