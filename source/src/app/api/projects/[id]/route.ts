// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'
import { runAutomations } from '@/lib/automation'
import type { ProjectStatus } from '@/lib/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: true,
      tracks: { include: { files: true }, orderBy: { order: 'asc' } },
      files: { include: { uploadedBy: true }, orderBy: { createdAt: 'desc' } },
      versions: { include: { creator: true, comments: { include: { author: true } } }, orderBy: { createdAt: 'desc' } },
      tasks: { include: { assignee: true }, orderBy: { createdAt: 'desc' } },
      activities: { include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 20 },
      invoices: true,
    },
  })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado a este projeto' }, { status: 403 })
  }
  return NextResponse.json(project)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, status, service, price, deadline, description } = body
  const before = await db.project.findUnique({ where: { id } })
  const updated = await db.project.update({
    where: { id },
    data: {
      name,
      status: status as ProjectStatus | undefined,
      service,
      price,
      deadline: deadline ? new Date(deadline) : undefined,
      description,
    },
    include: { client: true },
  })
  if (status && before?.status !== status) {
    await db.activity.create({
      data: { actorId: ctx.userId, projectId: id, action: 'status', resource: 'project', resourceId: id, detail: `Status: ${before?.status} → ${status}` },
    })
    // Notifica o cliente quando algo muda para "Client Review"
    if (status === 'Client Review' && before?.client) {
      const clientUser = await db.user.findFirst({ where: { clientId: before.clientId } })
      if (clientUser) {
        await db.notification.create({
          data: { userId: clientUser.id, type: 'project', title: `Nova versão disponível em "${before.name}"`, body: 'Está pronta para sua revisão.', read: false },
        })
      }
    }
    // Dispara automações de mudança de status
    void runAutomations('project_status_change', { projectId: id, from: before?.status, to: status })
  }
  await audit({ actor: ctx.userName, role: ctx.role, action: 'project.update', resource: 'project', resourceId: id, detail: status ? `status=${status}` : 'update' })
  return NextResponse.json(updated)
}
