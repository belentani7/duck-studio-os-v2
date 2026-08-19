// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/tasks
export async function GET(req: Request) {
  const ctx = await getOperationalContext('/tasks')
  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')
  const status = url.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (ctx.role === 'CLIENT') {
    // Cliente só vê tarefas dos próprios projetos
    where.project = { clientId: ctx.clientId }
  }

  const tasks = await db.task.findMany({
    where,
    include: { project: { include: { client: true } }, assignee: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tasks)
}

// POST /api/tasks
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/tasks')
  if (!can(ctx.role, 'tasks:create')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { title, projectId, priority, dueDate, assigneeId, status } = body
  if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const task = await db.task.create({
    data: {
      title,
      projectId: projectId ?? null,
      priority: priority ?? 'medium',
      status: status ?? 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId ?? null,
    },
    include: { project: true, assignee: true },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'task.create', resource: 'task', resourceId: task.id, detail: title })
  return NextResponse.json(task, { status: 201 })
}
