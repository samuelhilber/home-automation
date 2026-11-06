import { asset } from '../lib/asset'
import { SCENES, type Scene } from '../lib/sun'
import './Sky.css'

export default function Sky({ scene }: { scene: Scene }) {
  return (
    <div className="sky" aria-hidden="true">
      {SCENES.map((s) => (
        <div key={s} className={s === scene ? 'on' : undefined} style={{ backgroundImage: `url(${asset(`bg-${s}.jpg`)})` }} />
      ))}
    </div>
  )
}
