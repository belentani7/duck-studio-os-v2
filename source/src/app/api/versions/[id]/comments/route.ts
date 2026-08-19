// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/versions/[id]/comments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await db.comment.findMany({
    where: { versionId: id },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

// POST /api/versions/[id]/comments
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  const body = await req.json()
  const { body: text, timestamp } = body
  if (!text) return NextResponse.json({ error: 'Comentário vazio' }, { status: 400 })

  const version = await db.version.findUnique({ where: { id }, include: { project: true } })
  if (!version) return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 })
  if (ctx.role === 'CLIENT' && version.project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const comment = await db.comment.create({
    data: { versionId: id, authorId: ctx.userId, body: text, timestamp: timestamp ?? null },
    include: { author: true },
  })
  await db.activity.create({
    data: { actorId: ctx.userId, projectId: version.projectId, action: 'comment', resource: 'version', resourceId: id, detail: `${ctx.userName} comentou em ${version.name}` },
  })

  // Se cliente comenta, notifica owner; se owner comenta em versão em revisão, notifica cliente
  if (ctx.role === 'CLIENT') {
    const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
    if (owner) await db.notification.create({ data: { userId: owner.id, type: 'project', title: `Comentário de ${ctx.userName} em ${version.name}`, body: text, read: false } })
  } else if (version.status === 'review') {
    const clientUser = await db.user.findFirst({ where: { clientId: version.project.clientId } })
    if (clientUser) await db.notification.create({ data: { userId: clientUser.id, type: 'project', title: `Novo comentário em ${version.name}`, body: text, read: false } })
  }

  return NextResponse.json(comment, { status: 201 })
}
