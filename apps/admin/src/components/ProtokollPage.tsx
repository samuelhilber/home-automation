import { useMemo, useState } from 'react'
import Icon from './Icon'
import { statusApi, type ActivityEntry } from '../api'
import { useStatus } from '../useStatus'
import './ProtokollPage.css'

const ZONE = 'Europe/Zurich'

// "2026-11-25" -> "Heute", "Gestern" or "Mittwoch, 25. November"
function dayHeading(date: string): string {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: ZONE })
  if (date === today) return 'Heute'
  const yesterday = new Date(Date.parse(today + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10)
  if (date === yesterday) return 'Gestern'
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}

// The api sends newest first, so entries of one day are next to each other.
function groupByDay(entries: ActivityEntry[]): { date: string; entries: ActivityEntry[] }[] {
  const days: { date: string; entries: ActivityEntry[] }[] = []
  for (const e of entries) {
    const last = days[days.length - 1]
    if (last && last.date === e.date) last.entries.push(e)
    else days.push({ date: e.date, entries: [e] })
  }
  return days
}

export default function ProtokollPage({ onBack }: { onBack: () => void }) {
  const { data, loaded, failed } = useStatus(() => statusApi.activity(500), 60000)
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter((e) => !q || `${e.title} ${e.detail}`.toLowerCase().includes(q))
  }, [data, query])
  const days = groupByDay(shown)

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Protokoll</div>
          <h1>Was zuletzt passiert ist.</h1>
          <p className="lede">Die letzten 10 Tage aus dem Logbuch von Home Assistant, neueste zuerst.</p>
        </div>
        <button type="button" className="link back" onClick={onBack}>
          <Icon name="arrow-right" />
          Zur Übersicht
        </button>
      </div>

      <section className="card log-card">
        <div className="log-tools">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen, zum Beispiel Wecker"
            aria-label="Protokoll durchsuchen"
          />
          <small className="tabular">
            {query ? `${shown.length} von ${data?.length ?? 0}` : `${data?.length ?? 0}`} Einträge
          </small>
        </div>

        {failed && !data && <p className="log-note">Home Assistant antwortet nicht. Das Protokoll kommt von dort.</p>}
        {!loaded && !failed && <p className="log-note">Lädt …</p>}
        {loaded && data?.length === 0 && <p className="log-note">In den letzten 10 Tagen wurde noch nichts aufgezeichnet.</p>}
        {loaded && data && data.length > 0 && shown.length === 0 && <p className="log-note">Nichts gefunden für „{query}“.</p>}

        {days.map((day) => (
          <div className="log-day" key={day.date}>
            <h2>
              {dayHeading(day.date)}
              <small className="tabular">{day.entries.length}</small>
            </h2>
            <ol className="tabular">
              {day.entries.map((e, i) => (
                <li key={e.time + e.title + i}>
                  <time>{e.time}</time>
                  <span>
                    <b>{e.title}</b>
                    {e.detail && <small>{e.detail}</small>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </main>
  )
}
