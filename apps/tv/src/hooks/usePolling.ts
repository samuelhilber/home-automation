import { useEffect, useState } from 'react'

// Loads now and then every `everyMs`. The screen keeps showing the last good
// answer when a refresh fails, because it hangs on a wall and nobody can reload it.
export function usePolling<T>(load: () => Promise<T>, everyMs: number): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let alive = true
    const run = () =>
      load().then(
        (d) => alive && setData(d),
        () => undefined,
      )
    run()
    const id = setInterval(run, everyMs)
    return () => {
      alive = false
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyMs])
  return data
}
