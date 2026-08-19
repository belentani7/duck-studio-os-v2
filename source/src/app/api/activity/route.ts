// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/activity
export async function GET(req: Request) {
  const ctx = await getOperationalContext('/')
  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')
  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (ctx.role === 'CLIENT') {
    where.project = { clientId: ctx.clientId }
  }
  const activities = await db.activity.findMany({
    where,
    include: { actor: true, project: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  return NextResponse.json(activities)
}
