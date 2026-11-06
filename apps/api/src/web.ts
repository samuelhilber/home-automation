import { resolve } from 'node:path'
import fastifyStatic from '@fastify/static'
import type { FastifyInstance } from 'fastify'

// ADR-026: the api also serves the built apps. `root` holds two folders, `admin/`
// (served at /) and `tv/` (served at /tv/, built with base /tv/). Unknown
// paths under /api stay 404 JSON; unknown paths elsewhere are plain 404.
export async function serveApps(app: FastifyInstance, root: string) {
  const base = resolve(root)
  await app.register(fastifyStatic, { root: resolve(base, 'admin'), prefix: '/' })
  await app.register(fastifyStatic, { root: resolve(base, 'tv'), prefix: '/tv/', decorateReply: false })
  app.get('/tv', async (_req, reply) => reply.redirect('/tv/'))
}
