// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/search?q=term — global search across clients, projects, tasks, plugins
export async function GET(req: Request) {
  const ctx = await getOperationalContext('/')
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase()
  if (!q || q.length < 1) return NextResponse.json({ clients: [], projects: [], tasks: [], plugins: [] })

  const isClient = ctx.role === 'CLIENT'

  const [clients, projects, tasks, plugins] = await Promise.all([
    isClient
      ? db.client.findMany({ where: { id: ctx.clientId ?? '', OR: [{ name: { contains: q } }, { email: { contains: q } }, { artistName: { contains: q } }] }, take: 5 })
      : db.client.findMany({ where: { OR: [{ name: { contains: q } }, { email: { contains: q } }, { artistName: { contains: q } }, { tags: { contains: q } }] }, take: 5, include: { _count: { select: { projects: true } } } }),
    db.project.findMany({
      where: {
        AND: [
          isClient ? { clientId: ctx.clientId ?? '' } : {},
          { OR: [{ name: { contains: q } }, { description: { contains: q } }, { service: { contains: q } }] },
        ],
      },
      take: 8,
      include: { client: true },
      orderBy: { updatedAt: 'desc' },
    }),
    db.task.findMany({
      where: {
        AND: [
          isClient ? { project: { clientId: ctx.clientId ?? '' } } : {},
          { title: { contains: q } },
        ],
      },
      take: 5,
      include: { project: true },
    }),
    isClient
      ? Promise.resolve([])
      : db.plugin.findMany({ where: { OR: [{ name: { contains: q } }, { developer: { contains: q } }, { tags: { contains: q } }, { category: { contains: q } }] }, take: 5 }),
  ])

  return NextResponse.json({ clients, projects, tasks, plugins })
}
