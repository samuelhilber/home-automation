import { player as p } from '../mockData'
import './PlayerPanel.css'

export default function PlayerPanel() {
  return (
    <section className="panel live player">
      <div className="head">
        Spotify {p.playing && <span className="pill">L&auml;uft</span>}
      </div>
      <div className="np">
        <div className="art">
          <i />
        </div>
        <div className="t">
          <div className="song">{p.song}</div>
          <div className="artist">{p.artist}</div>
          <div className="list">&#9654; {p.playlist}</div>
        </div>
      </div>
      <div className="prog tabular">
        <span>{p.elapsed}</span>
        <div className="track">
          <span style={{ width: `${p.progressPercent}%` }} />
        </div>
        <span>{p.total}</span>
      </div>
      <div className="ctl">
        <span>&#9664;&#9664;</span>
        <span className="main">&#10074;&#10074;</span>
        <span>&#9654;&#9654;</span>
      </div>
      <div className="foot">// Demo &ndash; keine Echtzeit-Daten</div>
    </section>
  )
}
