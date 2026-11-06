import { useEffect, useRef, useState } from 'react'
import { SCENES, sceneFor, type Scene } from '../lib/sun'
import type { ZurichNow } from '../lib/time'

// The sky follows the sun. #sunrise, #noon, #sunset or #midnight pins one scene for review,
// #cycle steps through all four every 15 s.
export function useScene(now: ZurichNow): Scene {
  const [hash, setHash] = useState(() => location.hash)
  const [cycleIndex, setCycleIndex] = useState(0)
  const instantNext = useRef(true)

  useEffect(() => {
    const onHash = () => {
      instantNext.current = true
      setHash(location.hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const cycling = hash === '#cycle'
  useEffect(() => {
    if (!cycling) return
    const id = setInterval(() => setCycleIndex((i) => (i + 1) % SCENES.length), 15000)
    return () => clearInterval(id)
  }, [cycling])

  const pinned = SCENES.find((s) => `#${s}` === hash)
  const scene = cycling ? SCENES[cycleIndex] : (pinned ?? sceneFor(now))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('cycle', cycling)
    root.dataset.scene = scene
    if (instantNext.current) {
      instantNext.current = false
      root.classList.add('instant')
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('instant')))
    }
  }, [scene, cycling])

  return scene
}
