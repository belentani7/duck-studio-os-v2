// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/invoices
export async function GET() {
  const ctx = await getOperationalContext('/finance')
  if (ctx.role === 'CLIENT') {
    if (!ctx.clientId) return NextResponse.json([])
    const invoices = await db.invoice.findMany({ where: { clientId: ctx.clientId }, include: { project: true, items: true }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(invoices)
  }
  if (!can(ctx.role, 'finance:view')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const invoices = await db.invoice.findMany({ include: { client: true, project: true, items: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(invoices)
}

// POST /api/invoices
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/finance')
  if (!can(ctx.role, 'finance:create')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { clientId, projectId, amount, currency, status, dueDate, number, notes, items } = body
  if (!clientId || amount == null) return NextResponse.json({ error: 'Cliente e valor obrigatórios' }, { status: 400 })

  const count = await db.invoice.count()
  const invoice = await db.invoice.create({
    data: {
      clientId,
      projectId: projectId ?? null,
      number: number ?? `RNF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
      amount,
      currency: currency ?? 'EUR',
      status: status ?? 'draft',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      items: items?.length ? { create: items } : undefined,
    },
    include: { client: true, project: true, items: true },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'invoice.create', resource: 'invoice', resourceId: invoice.id, detail: invoice.number })
  return NextResponse.json(invoice, { status: 201 })
}

// PATCH /api/invoices (marca como paga etc.)
export async function PATCH(req: Request) {
  const ctx = await getOperationalContext('/finance')
  if (!can(ctx.role, 'finance:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { id, status } = body
  const updated = await db.invoice.update({ where: { id }, data: { status } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'invoice.update', resource: 'invoice', resourceId: id, detail: status })
  return NextResponse.json(updated)
}
