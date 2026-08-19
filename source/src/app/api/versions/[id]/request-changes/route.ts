// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'
import { runAutomations } from '@/lib/automation'

// POST /api/versions/[id]/request-changes
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/portal')
  const { id } = await params
  if (!can(ctx.role, 'versions:request_changes')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const { note } = body as { note?: string }
  const version = await db.version.findUnique({ where: { id }, include: { project: true } })
  if (!version) return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 })
  if (ctx.role === 'CLIENT' && version.project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const updated = await db.version.update({ where: { id }, data: { status: 'changes_requested' } })
  await db.project.update({ where: { id: version.projectId }, data: { status: 'Changes Requested' } })

  if (note) {
    await db.comment.create({ data: { versionId: id, authorId: ctx.userId, body: `Alteração solicitada: ${note}` } })
  }
  await db.activity.create({ data: { actorId: ctx.userId, projectId: version.projectId, action: 'request_changes', resource: 'version', resourceId: id, detail: `${ctx.userName} pediu alterações em ${version.name}` } })

  const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
  if (owner) await db.notification.create({ data: { userId: owner.id, type: 'project', title: `${ctx.userName} pediu alterações em ${version.name}`, body: note ?? 'Ver comentários.', read: false } })

  // Dispara automações de pedido de alteração
  void runAutomations('version_request_changes', { projectId: version.projectId, versionId: id, note })

  await audit({ actor: ctx.userName, role: ctx.role, action: 'version.request_changes', resource: 'version', resourceId: id, detail: note })
  return NextResponse.json(updated)
}
