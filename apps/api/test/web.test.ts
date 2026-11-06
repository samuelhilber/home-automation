import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { serveApps } from '../src/web.ts'
import { FakeHa } from './fakeHa.ts'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'web-'))
  for (const [name, text] of [['admin', 'ADMIN'], ['tv', 'TV']]) {
    mkdirSync(join(dir, name))
    writeFileSync(join(dir, name, 'index.html'), `<html>${text}</html>`)
  }
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('serving the built apps', () => {
  it('serves admin at / and the TV page at /tv/, next to the api', async () => {
    const app = buildApp(new FakeHa())
    await serveApps(app, dir)
    expect((await app.inject({ url: '/' })).body).toContain('ADMIN')
    expect((await app.inject({ url: '/tv/' })).body).toContain('TV')
    expect((await app.inject({ url: '/tv' })).headers.location).toBe('/tv/')
    expect((await app.inject({ url: '/api/alarms/options' })).statusCode).toBe(200)
    expect((await app.inject({ url: '/nope' })).statusCode).toBe(404)
  })
})
