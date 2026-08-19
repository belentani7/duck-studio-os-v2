// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'
import { runAutomations } from '@/lib/automation'

// POST /api/versions/[id]/approve — cliente aprova versão
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/portal')
  const { id } = await params
  if (!can(ctx.role, 'versions:approve')) {
    return NextResponse.json({ error: 'Sem permissão para aprovar' }, { status: 403 })
  }
  const version = await db.version.findUnique({ where: { id }, include: { project: true } })
  if (!version) return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 })
  if (ctx.role === 'CLIENT' && version.project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const updated = await db.version.update({ where: { id }, data: { status: 'approved' } })
  // Supersede versões anteriores do mesmo projeto
  await db.version.updateMany({
    where: { projectId: version.projectId, id: { not: id }, status: { in: ['review', 'changes_requested', 'draft'] } },
    data: { status: 'superseded' },
  })
  // Atualiza status do projeto
  await db.project.update({ where: { id: version.projectId }, data: { status: 'Approved' } })

  await db.activity.create({ data: { actorId: ctx.userId, projectId: version.projectId, action: 'approve', resource: 'version', resourceId: id, detail: `${ctx.userName} aprovou ${version.name}` } })

  const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
  if (owner) await db.notification.create({ data: { userId: owner.id, type: 'project', title: `${ctx.userName} aprovou ${version.name}`, body: 'Pronto para entrega final.', read: false } })

  // Dispara automações de versão aprovada
  void runAutomations('version_approved', { projectId: version.projectId, versionId: id })

  await audit({ actor: ctx.userName, role: ctx.role, action: 'version.approve', resource: 'version', resourceId: id, detail: version.name })
  return NextResponse.json(updated)
}
