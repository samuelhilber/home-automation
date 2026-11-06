import Icon from './Icon'
import { tvStatus } from '../mockData'
import './TvCallToActionCard.css'

export default function TvCallToActionCard() {
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
          {tvStatus.room} · {tvStatus.connected ? 'verbunden' : 'nicht verbunden'}
          <small>{tvStatus.detail}</small>
        </div>
        <img className="egg" src="/assets/egg-ruffy.png" alt="" />
      </div>
    </section>
  )
}
