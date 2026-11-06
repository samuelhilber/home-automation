import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'
import { calendarApi, describeError, type CalendarEvent, type CalendarStatus } from '../api'
import './KalenderPage.css'

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}>
      <i />
    </button>
  )
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' })

// "YYYY-MM-DD" of today and tomorrow in Zurich, to label the two days.
function zurichDay(offset: number): string {
  const d = new Date(Date.now() + offset * 86400000)
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(d)
}

export default function KalenderPage() {
  const [data, setData] = useState<CalendarStatus | undefined>()
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    () =>
      calendarApi.status(2).then(
        (d) => {
          setData(d)
          setError(null)
        },
        (err) => setError(describeError(err)),
      ),
    [],
  )
  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 60000)
    return () => clearInterval(id)
  }, [load])

  // Every switch is saved by the api; the page then shows what the api now says.
  const run = (action: Promise<unknown>) => action.then(load, (err) => setError(describeError(err)))

  const calendars = data?.calendars ?? []
  const sources = [...new Set(calendars.map((c) => c.source))]
  const names = new Map(calendars.map((c) => [c.id, `${c.source} · ${c.name}`]))

  const days: [string, string][] = [
    ['Heute', zurichDay(0)],
    ['Morgen', zurichDay(1)],
  ]

  // For a recurring event the switch applies to the whole series.
  const togglePreview = (e: CalendarEvent) => run(calendarApi.setEventShown(e.calendarId, e.uid, !e.shown))

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Kalender-Import</div>
          <h1>Deine Termine.</h1>
          <p className="lede">Wähle, welche Kalender zählen und welche Termine auf dem Morgenbildschirm erscheinen.</p>
        </div>
      </div>

      {error && <div className="hint">{error}</div>}

      <div className="cal-grid">
        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="calendar-import" />
              Quellen
            </span>
          </div>
          {data && calendars.length === 0 && (
            <div className="hint">
              <Icon name="info" />
              Noch kein Kalender eingerichtet. Die Links werden von Hand in die Datei auf dem Pi eingetragen.
            </div>
          )}
          {sources.map((source) => (
            <div key={source} className="src">
              <b>{source}</b>
              {calendars
                .filter((c) => c.source === source)
                .map((c) => (
                  <div key={c.id}>
                    <div className="cal-line">
                      <span>{c.name}</span>
                      <Switch on={c.on} label={`${c.source}: ${c.name}`} onToggle={() => run(calendarApi.setCalendarOn(c.id, !c.on))} />
                    </div>
                    <div className="cal-line muted">
                      <span>{c.ok ? `Zuletzt geladen um ${clock(c.lastSuccess!)}` : 'Noch keine Daten, Download klappt nicht'}</span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="list" />
              Termine · Vorschau auf dem Morgenbildschirm
            </span>
          </div>
          {days.map(([label, date]) => {
            const dayEvents = (data?.events ?? []).filter((e) => e.date === date)
            return (
              <div key={label}>
                <div className="day-head">{label}</div>
                {data && dayEvents.length === 0 && <div className="ev-empty">Keine Termine.</div>}
                {dayEvents.map((e) => (
                  <div key={`${e.calendarId}:${e.uid}:${e.start}`} className="ev">
                    <span className="ev-time tabular">{e.allDay ? 'ganztägig' : `${e.start}–${e.end}`}</span>
                    <span className="ev-name">
                      {e.title}
                      {e.series && <span className="series">↻ Serie</span>}
                      <small>{names.get(e.calendarId)}</small>
                    </span>
                    <Switch on={e.shown} label={`${e.title} in der Vorschau zeigen`} onToggle={() => togglePreview(e)} />
                  </div>
                ))}
              </div>
            )
          })}
          <div className="hint">
            <Icon name="info" />
            Neue Termine sind standardmässig an. Bei einer Serie gilt der Schalter für die ganze Serie.
          </div>
        </section>
      </div>
    </main>
  )
}
