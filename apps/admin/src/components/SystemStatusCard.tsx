import Icon from './Icon'
import { statusApi } from '../api'
import { uptimeLabel } from '../format'
import { useStatus } from '../useStatus'
import { watchdogView } from '../watchdogView'
import './SystemStatusCard.css'

export default function SystemStatusCard() {
  const { data: sys, loaded } = useStatus(statusApi.system)
  const { data: watchdog, loaded: dogLoaded } = useStatus(statusApi.watchdog)
  const dog = watchdogView(watchdog, dogLoaded)
  const pi = sys?.reading ?? null
  // The Pi counts as online when its probe answers; if only Home Assistant answers it is online without values.
  const online = sys ? sys.probe || sys.homeAssistant : false
  return (
    <section className="card">
      <div className="card-head">
        <span className="label">
          <Icon name="activity" />
          Systemstatus
        </span>
        <span className="stamp">Aktualisiert alle 30 Sek.</span>
      </div>
      <div className="pair">
        <div className="tile">
          <div className="name">
            <Icon name="cpu" />
            Raspberry Pi
          </div>
          <div className="state">
            <i />
            {sys ? (online ? 'Online' : 'Offline') : loaded ? 'Unbekannt' : 'Lädt …'}
          </div>
          <div className="detail tabular">{pi ? `Laufzeit ${uptimeLabel(pi.uptimeSeconds)}` : '–'}</div>
        </div>
        <div className="tile">
          <div className="name">
            <Icon name="shield" />
            Watchdog
          </div>
          <div className={`state${dog.ok || !dogLoaded ? '' : ' bad'}`}>
            <i />
            {dog.text}
          </div>
          <div className="detail tabular">{dog.clock === '–' ? '–' : `Letztes Signal um ${dog.clock}, ${dog.ago}`}</div>
        </div>
      </div>
      <div className="sys-foot tabular">
        <span>
          {pi ? (
            <>
              CPU {pi.tempC != null ? Math.round(pi.tempC) : '–'}&nbsp;°C &nbsp;·&nbsp; Speicher {pi.memory.percent}&nbsp;%
              &nbsp;·&nbsp; Netz {pi.internet.reachable ? 'stabil' : 'ohne Internet'}
            </>
          ) : (
            'Keine Messwerte vom Pi'
          )}
        </span>
        <button type="button" className="link">
          Details
          <Icon name="arrow-right" />
        </button>
      </div>
    </section>
  )
}
