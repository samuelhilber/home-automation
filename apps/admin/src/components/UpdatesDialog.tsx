import { useEffect, useState } from 'react'
import type { PendingUpdate } from '../api'
import './UpdatesDialog.css'

type Props = {
  updates: PendingUpdate[]
  blockedUntil: string | null // HH:MM the night window closes (ADR-019), null during the day
  loaded: boolean
  busyId: string | null // the update whose install request is on its way
  error: string | null
  onInstall: (id: string) => void
  onClose: () => void
}

export default function UpdatesDialog({ updates, blockedUntil, loaded, busyId, error, onInstall, onClose }: Props) {
  // "Später" only hides the item for this opening of the dialog.
  const [later, setLater] = useState<string[]>([])
  const shown = updates.filter((u) => !later.includes(u.id))
  const anyRunning = updates.some((u) => u.inProgress)

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

        {!loaded && <p className="dlg-empty">Lädt …</p>}
        {loaded && shown.length === 0 && <p className="dlg-empty">Keine Updates warten.</p>}
        {error && <p className="dlg-error">{error}</p>}
        {blockedUntil && shown.length > 0 && (
          <p className="dlg-hint">Nachtsperre: Installieren geht wieder ab {blockedUntil} Uhr.</p>
        )}
        {shown.map((u) => (
          <div key={u.id} className="upd">
            <b>{u.name}</b>
            <div className="ver tabular">
              <s>{u.from}</s> → <span>{u.to}</span>
              {u.notesUrl && (
                <>
                  {' · '}
                  <a href={u.notesUrl} target="_blank" rel="noreferrer">
                    Versionshinweise ↗
                  </a>
                </>
              )}
            </div>
            {u.inProgress && <div className="dlg-hint">Wird installiert …</div>}
            <div className="dlg-acts">
              <button type="button" className="btn ghost" onClick={() => setLater((l) => [...l, u.id])}>
                Später
              </button>
              <button
                type="button"
                className="btn"
                disabled={blockedUntil !== null || u.inProgress || anyRunning || busyId !== null}
                onClick={() => onInstall(u.id)}
              >
                Installieren
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
