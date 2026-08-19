// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/crm')
  const { id } = await params
  const client = await db.client.findUnique({
    where: { id },
    include: {
      projects: { include: { versions: true }, orderBy: { updatedAt: 'desc' } },
      invoices: true,
      histories: { orderBy: { createdAt: 'desc' } },
      contacts: true,
      memories: true,
    },
  })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && ctx.clientId !== id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/crm')
  const { id } = await params
  if (!can(ctx.role, 'crm:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, email, phone, company, artistName, tags, notes, language, timezone } = body
  const updated = await db.client.update({
    where: { id },
    data: {
      name, email, phone, company, artistName, tags, notes, language, timezone,
    },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'client.update', resource: 'client', resourceId: id })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/crm')
  const { id } = await params
  if (!can(ctx.role, 'crm:delete')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.client.delete({ where: { id } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'client.delete', resource: 'client', resourceId: id })
  return NextResponse.json({ ok: true })
}
