import { useEffect, useState } from 'react'

// `loaded` is false until the first answer, so "nothing" (null) can be told from "not yet".
export type Loaded<T> = { data: T | undefined; loaded: boolean; failed: boolean }

// Loads once, then every `everyMs`. Keeps the last good data when a refresh
// fails, so a short Home Assistant hiccup does not blank the cards.
export function useStatus<T>(load: () => Promise<T>, everyMs = 30000): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ data: undefined, loaded: false, failed: false })
  useEffect(() => {
    let alive = true
    const run = () =>
      load().then(
        (data) => alive && setState({ data, loaded: true, failed: false }),
        () => alive && setState((s) => ({ ...s, failed: true })),
      )
    run()
    const id = setInterval(run, everyMs)
    return () => {
      alive = false
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyMs])
  return state
}
