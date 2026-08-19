// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/projects/[id]/versions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { clientId: true } })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const versions = await db.version.findMany({
    where: { projectId: id },
    include: { creator: true, comments: { include: { author: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(versions)
}

// POST /api/projects/[id]/versions — cria nova versão
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  if (!can(ctx.role, 'versions:create')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, notes, parentVersionId } = body
  if (!name) return NextResponse.json({ error: 'Nome da versão é obrigatório' }, { status: 400 })

  const version = await db.version.create({
    data: {
      projectId: id,
      name,
      notes: notes ?? null,
      parentVersionId: parentVersionId ?? null,
      status: 'draft',
      creatorId: ctx.userId,
    },
    include: { creator: true },
  })
  await db.activity.create({ data: { actorId: ctx.userId, projectId: id, action: 'create', resource: 'version', resourceId: version.id, detail: `${ctx.userName} criou ${name}` } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'version.create', resource: 'version', resourceId: version.id, detail: name })
  return NextResponse.json(version, { status: 201 })
}
