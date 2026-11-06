import { asset } from '../lib/asset'
import { hours } from '../mockData'
import { DAYS_TC, dm, pad, utcDate, type ZurichNow } from '../lib/time'
import './TodayPanel.css'

export default function TodayPanel({ now }: { now: ZurichNow }) {
  const today = utcDate(now.y, now.m, now.d)

  return (
    <section className="panel p-today">
      <div className="head">
        Heute &mdash; {DAYS_TC[today.getUTCDay()]} {dm(today)}
      </div>
      <div className="hours tabular">
        {hours.map(({ h, bar }) => (
          <div key={h} className={`hour${h === now.h ? ' now' : ''}`}>
            <time>{pad(h)}:00</time>
            {bar && (
              <div className={`bar${bar.style ? ` ${bar.style}` : ''}`} style={bar.maxWidth ? { maxWidth: bar.maxWidth } : undefined}>
                {bar.text}
              </div>
            )}
          </div>
        ))}
      </div>
      <img className="egg" src={asset('egg-ichigo.png')} alt="" />
    </section>
  )
}
