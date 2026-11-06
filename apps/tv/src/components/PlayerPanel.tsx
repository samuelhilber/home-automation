import { statusApi } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import './PlayerPanel.css'

const clock = (sec: number | null) => (sec === null ? '–:––' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`)

export default function PlayerPanel() {
  const p = usePolling(statusApi.player, 5000)
  const progress = p?.durationSec && p.positionSec !== null ? Math.min(100, (p.positionSec / p.durationSec) * 100) : 0

  return (
    <section className="panel live player">
      <div className="head">
        Musik {p?.playing && <span className="pill">L&auml;uft</span>}
      </div>
      <div className="np">
        <div className="art">
          <i />
        </div>
        <div className="t">
          <div className="song">{p?.title ?? 'Nichts läuft'}</div>
          <div className="artist">{p?.artist ?? ' '}</div>
          {p?.playlist && <div className="list">&#9654; {p.playlist}</div>}
        </div>
      </div>
      <div className="prog tabular">
        <span>{clock(p?.positionSec ?? null)}</span>
        <div className="track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span>{clock(p?.durationSec ?? null)}</span>
      </div>
      <div className="ctl">
        <span>&#9664;&#9664;</span>
        <span className="main">{p?.playing ? '❚❚' : '▶'}</span>
        <span>&#9654;&#9654;</span>
      </div>
    </section>
  )
}
