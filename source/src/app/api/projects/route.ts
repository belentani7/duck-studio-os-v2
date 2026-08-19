// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/projects
export async function GET(req: Request) {
  const ctx = await getOperationalContext('/projects')
  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId')
  const status = url.searchParams.get('status')

  if (ctx.role === 'CLIENT') {
    if (!ctx.clientId) return NextResponse.json([])
    const projects = await db.project.findMany({
      where: { clientId: ctx.clientId },
      include: { client: true, versions: true, _count: { select: { files: true, tasks: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(projects)
  }

  const where: Record<string, unknown> = {}
  if (clientId) where.clientId = clientId
  if (status) where.status = status

  const projects = await db.project.findMany({
    where,
    include: {
      client: true,
      _count: { select: { files: true, versions: true, tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(projects)
}

// POST /api/projects
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/projects')
  if (!can(ctx.role, 'projects:create')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, clientId, service, status, price, currency, deadline, description } = body
  if (!name || !clientId) {
    return NextResponse.json({ error: 'Nome e cliente são obrigatórios' }, { status: 400 })
  }
  const project = await db.project.create({
    data: {
      name,
      clientId,
      service: service ?? 'Mastering',
      status: status ?? 'Lead',
      price: price ?? 0,
      currency: currency ?? 'EUR',
      deadline: deadline ? new Date(deadline) : null,
      description: description ?? null,
      ownerId: ctx.userId,
    },
    include: { client: true },
  })
  await db.activity.create({ data: { actorId: ctx.userId, projectId: project.id, action: 'create', resource: 'project', resourceId: project.id, detail: `Criou projeto ${name}` } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'project.create', resource: 'project', resourceId: project.id, detail: name })
  return NextResponse.json(project, { status: 201 })
}
