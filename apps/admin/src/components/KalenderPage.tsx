import { useState } from 'react'
import Icon from './Icon'
import { calendarSources, initialEvents, type CalendarEvent, type CalendarSource } from '../mockData'
import './KalenderPage.css'

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}>
      <i />
    </button>
  )
}

export default function KalenderPage() {
  const [sources, setSources] = useState<CalendarSource[]>(calendarSources)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  const offCalendars = new Set(sources.flatMap((s) => s.calendars.filter((c) => !c.on).map((c) => c.id)))
  const visible = events.filter((e) => !offCalendars.has(e.calendarId))

  function toggleCalendar(sourceId: string, calId: string) {
    setSources((list) =>
      list.map((s) =>
        s.id === sourceId ? { ...s, calendars: s.calendars.map((c) => (c.id === calId ? { ...c, on: !c.on } : c)) } : s,
      ),
    )
  }

  // For a recurring event the switch applies to the whole series.
  function togglePreview(event: CalendarEvent) {
    const next = !event.preview
    setEvents((list) =>
      list.map((e) => (e.id === event.id || (event.seriesId && e.seriesId === event.seriesId) ? { ...e, preview: next } : e)),
    )
  }

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Kalender-Import</div>
          <h1>Deine Termine.</h1>
          <p className="lede">Wähle, welche Kalender zählen und welche Termine auf dem Morgenbildschirm erscheinen.</p>
        </div>
      </div>

      <div className="cal-grid">
        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="calendar-import" />
              Quellen
            </span>
          </div>
          {sources.map((s) => (
            <div key={s.id} className="src">
              <b>{s.name}</b>
              {s.calendars.map((c) => (
                <div key={c.id} className="cal-line">
                  <span>{c.name}</span>
                  <Switch on={c.on && s.signedIn} label={`${s.name}: ${c.name}`} onToggle={() => toggleCalendar(s.id, c.id)} />
                </div>
              ))}
              {!s.signedIn && (
                <div className="cal-line muted">
                  <span>Noch nicht angemeldet</span>
                  <button type="button" className="btn ghost small" disabled title="Anmeldung gibt es erst mit dem Backend">
                    Anmelden
                  </button>
                </div>
              )}
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
          {(['Heute', 'Morgen'] as const).map((day) => {
            const dayEvents = visible.filter((e) => e.day === day)
            return (
              <div key={day}>
                <div className="day-head">{day}</div>
                {dayEvents.length === 0 && <div className="ev-empty">Keine Termine.</div>}
                {dayEvents.map((e) => (
                  <div key={e.id} className="ev">
                    <span className="ev-time tabular">{e.time}</span>
                    <span className="ev-name">
                      {e.title}
                      {e.seriesId && <span className="series">↻ Serie</span>}
                      <small>{e.sourceLabel}</small>
                    </span>
                    <Switch on={e.preview} label={`${e.title} in der Vorschau zeigen`} onToggle={() => togglePreview(e)} />
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
