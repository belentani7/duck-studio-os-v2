// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/automations')
  const { id } = await params
  if (!can(ctx.role, 'studio:settings')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, trigger, condition, action, enabled } = body
  if (action) { try { JSON.parse(action) } catch { return NextResponse.json({ error: 'action deve ser JSON válido' }, { status: 400 }) } }
  if (condition) { try { JSON.parse(condition) } catch { return NextResponse.json({ error: 'condition deve ser JSON válido' }, { status: 400 }) } }

  const updated = await db.automation.update({
    where: { id },
    data: { name, trigger, condition: condition === null ? null : (condition ?? undefined), action, enabled },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'automation.update', resource: 'automation', resourceId: id, detail: enabled !== undefined ? `enabled=${enabled}` : 'update' })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/automations')
  const { id } = await params
  if (!can(ctx.role, 'studio:settings')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.automation.delete({ where: { id } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'automation.delete', resource: 'automation', resourceId: id })
  return NextResponse.json({ ok: true })
}
