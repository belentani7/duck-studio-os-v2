// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/chains')
  const { id } = await params
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, category, genre, description, steps, favorite } = body
  if (steps) { try { JSON.parse(steps) } catch { return NextResponse.json({ error: 'steps deve ser JSON válido' }, { status: 400 }) } }

  const updated = await db.processingChain.update({
    where: { id },
    data: { name, category, genre, description, steps, favorite },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'chain.update', resource: 'chain', resourceId: id })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/chains')
  const { id } = await params
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.processingChain.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// POST /api/chains/[id] — incrementar uso (quando aplicada a um projeto)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/chains')
  const { id } = await params
  const updated = await db.processingChain.update({ where: { id }, data: { uses: { increment: 1 } } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'chain.apply', resource: 'chain', resourceId: id })
  return NextResponse.json(updated)
}
