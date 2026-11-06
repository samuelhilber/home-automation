// Reads the small probe program that runs on the Pi (tools/pi-probe). It only
// reports CPU, temperature, memory, disk, uptime and internet; no secrets.

export type ProbeReading = {
  cpuPercent: number
  tempC: number | null
  memory: { totalMb: number; usedMb: number; percent: number }
  disk: { totalGb: number; usedGb: number; percent: number }
  uptimeSeconds: number
  load1: number
  internet: { reachable: boolean; latencyMs: number | null }
}

// Tests swap in a fake. `null` means the probe did not answer.
export interface Probe {
  read(): Promise<ProbeReading | null>
}

export class HttpProbe implements Probe {
  private url: string

  constructor(url: string) {
    this.url = url
  }

  async read(): Promise<ProbeReading | null> {
    try {
      const res = await fetch(this.url, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) return null
      return (await res.json()) as ProbeReading
    } catch {
      return null
    }
  }
}

export class NoProbe implements Probe {
  async read(): Promise<null> {
    return null
  }
}

export type SystemStatus = {
  // False when the probe is not set up or does not answer; the reading is then empty.
  probe: boolean
  reading: ProbeReading | null
  homeAssistant: boolean
}
