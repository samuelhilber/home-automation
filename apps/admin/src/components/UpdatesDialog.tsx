import { useEffect, useState } from 'react'
import type { UpdateHistoryItem, UpdateItem } from '../mockData'
import './UpdatesDialog.css'

export type ScheduledUpdate = UpdateItem & { when: string }

type Props = {
  pending: UpdateItem[]
  scheduled: ScheduledUpdate[]
  history: UpdateHistoryItem[]
  nightLabel: string | null // e.g. "07.11. um 10:00" when installs are queued, null during the day
  onInstall: (id: string) => void
  onClose: () => void
}

export default function UpdatesDialog({ pending, scheduled, history, nightLabel, onInstall, onClose }: Props) {
  // "Später" only hides the item for this opening of the dialog.
  const [later, setLater] = useState<string[]>([])
  const shown = pending.filter((u) => !later.includes(u.id))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div className="dlg card" role="dialog" aria-modal="true" aria-label="Updates" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <span className="label">Updates</span>
          <button type="button" className="btn ghost small" onClick={onClose}>
            Schliessen
          </button>
        </div>

        {shown.length === 0 && <p className="dlg-empty">Keine Updates warten.</p>}
        {shown.map((u) => (
          <div key={u.id} className="upd">
            <b>{u.name}</b>
            <div className="ver tabular">
              <s>{u.from}</s> → <span>{u.to}</span> ·{' '}
              <a href={u.notesUrl} onClick={(e) => e.preventDefault()}>
                Versionshinweise ↗
              </a>
            </div>
            {nightLabel && <div className="dlg-hint">Wird am {nightLabel} installiert.</div>}
            <div className="dlg-acts">
              <button type="button" className="btn ghost" onClick={() => setLater((l) => [...l, u.id])}>
                Später
              </button>
              <button type="button" className="btn" onClick={() => onInstall(u.id)}>
                {nightLabel ? 'Einplanen' : 'Installieren'}
              </button>
            </div>
          </div>
        ))}

        <div className="queue">
          <b>Geplant</b>
          {scheduled.length === 0 && <div className="q-line muted">Nichts geplant.</div>}
          {scheduled.map((u) => (
            <div key={u.id} className="q-line">
              <span>
                {u.name} {u.from} → {u.to}
              </span>
              <span>{u.when}</span>
            </div>
          ))}
          <b className="q-title">Verlauf</b>
          {history.map((h) => (
            <div key={h.id} className="q-line">
              <span>
                {h.name} {h.from} → {h.to}
              </span>
              <span className={h.ok ? 'ok' : 'bad'}>
                {h.ok ? 'Erfolgreich' : 'Fehlgeschlagen'} · {h.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
