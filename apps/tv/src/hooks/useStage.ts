import { useEffect, useState } from 'react'

export const STAGE_W = 1920
export const STAGE_H = 1080
const PADDING = 28

// Scale factor that fits the fixed 1920x1080 stage into the window.
// The stage's own padding is the gutter; the 16 px outer gutter only matters on small screens.
function fitScale() {
  let scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
  if (PADDING * scale < 16) {
    scale = Math.min((window.innerWidth - 32) / STAGE_W, window.innerHeight / STAGE_H)
  }
  return scale
}

// OLED care: drift the whole stage a few pixels every few minutes so static edges never sit on the same subpixels.
const DRIFT_PATH: [number, number][] = [
  [0, 0],
  [3, 1],
  [4, -2],
  [1, -4],
  [-2, -3],
  [-4, 0],
  [-3, 3],
  [0, 4],
]

export function useStage() {
  const [scale, setScale] = useState(fitScale)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setStep((s) => (s + 1) % DRIFT_PATH.length), 180000)
    return () => clearInterval(id)
  }, [])

  const [dx, dy] = DRIFT_PATH[step]
  return { scale, dx, dy }
}
