import { useEffect, useState } from 'react'
import { zurichNow, type ZurichNow } from '../lib/time'

// Zurich wall-clock time, refreshed every 10 s (the screen only shows minutes).
export function useNow(): ZurichNow {
  const [now, setNow] = useState(() => zurichNow())
  useEffect(() => {
    const id = setInterval(() => setNow(zurichNow()), 10000)
    return () => clearInterval(id)
  }, [])
  return now
}
