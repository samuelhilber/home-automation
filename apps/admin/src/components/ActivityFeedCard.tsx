import Icon from './Icon'
import { activityFeed } from '../mockData'
import './ActivityFeedCard.css'

export default function ActivityFeedCard() {
  return (
    <section className="card">
      <div className="card-head">
        <span className="label">
          <Icon name="list" />
          Letzte Aktivitäten
        </span>
      </div>
      <div className="feed tabular">
        {activityFeed.map((entry) => (
          <div key={entry.time + entry.title}>
            <time>{entry.time}</time>
            <span>
              <b>{entry.title}</b>
              <small>{entry.detail}</small>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="link">
        Protokoll öffnen
        <Icon name="arrow-right" />
      </button>
      <img className="egg" src="/assets/egg-ichigo.png" alt="" />
    </section>
  )
}
