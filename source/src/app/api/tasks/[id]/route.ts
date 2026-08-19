// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// PATCH /api/tasks/[id] — atualiza status/prioridade
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/tasks')
  const { id } = await params
  if (!can(ctx.role, 'tasks:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { status, priority, dueDate, assigneeId, title } = body
  const updated = await db.task.update({
    where: { id },
    data: { status, priority, title, assigneeId, dueDate: dueDate ? new Date(dueDate) : undefined },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'task.update', resource: 'task', resourceId: id, detail: status ?? 'update' })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/tasks')
  const { id } = await params
  if (!can(ctx.role, 'tasks:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
