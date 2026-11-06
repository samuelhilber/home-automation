import Icon from './Icon'
import { statusApi } from '../api'
import { useStatus } from '../useStatus'
import './TvCallToActionCard.css'

const TV_DETAIL: Record<string, string> = { on: 'Eingeschaltet', off: 'Standby' }

export default function TvCallToActionCard() {
  const { data: tv, loaded } = useStatus(statusApi.tv)
  return (
    <section className="card cta">
      <div className="cta-copy">
        <span className="label">
          <Icon name="monitor-play" />
          Dein TV, dein Morgen
        </span>
        <h2>Nicht bis morgen warten.</h2>
        <p>Starte die Anzeige sofort. Dein Weckplan bleibt unverändert.</p>
        <button type="button" className="cta-btn">
          <Icon name="play" />
          <span>Morgenbildschirm jetzt auf dem TV zeigen</span>
          <Icon name="arrow-up-right" />
        </button>
      </div>
      <div className="cta-art forest">
        <div className="ready">
          <Icon name="sunrise" />
          BEREIT_
        </div>
        <div className="tv-line">
          <i />
          {tv?.name ?? 'TV'} · {!loaded ? 'prüft …' : tv?.reachable ? 'verbunden' : 'nicht verbunden'}
          {tv?.reachable && <small>{TV_DETAIL[tv.state] ?? tv.state}</small>}
        </div>
        <img className="egg" src="/assets/egg-ruffy.png" alt="" />
      </div>
    </section>
  )
}
