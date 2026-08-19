// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/invoices/[id] — single invoice with items
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/finance')
  const { id } = await params
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { client: true, project: true, items: { orderBy: { createdAt: 'asc' } } },
  })
  if (!invoice) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
  if (ctx.role === 'CLIENT' && invoice.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  return NextResponse.json(invoice)
}

// PATCH /api/invoices/[id] — update invoice + manage items
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/finance')
  const { id } = await params
  if (!can(ctx.role, 'finance:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { status, notes, dueDate, amount, addItem, removeItemId } = body

  if (addItem) {
    await db.invoiceItem.create({ data: { invoiceId: id, ...addItem } })
    // Recalc total
    const items = await db.invoiceItem.findMany({ where: { invoiceId: id } })
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    await db.invoice.update({ where: { id }, data: { amount: total } })
  }
  if (removeItemId) {
    await db.invoiceItem.delete({ where: { id: removeItemId } })
    const items = await db.invoiceItem.findMany({ where: { invoiceId: id } })
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    await db.invoice.update({ where: { id }, data: { amount: total } })
  }

  const updated = await db.invoice.update({
    where: { id },
    data: {
      status,
      notes,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      amount: amount ?? undefined,
    },
    include: { client: true, project: true, items: true },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'invoice.update', resource: 'invoice', resourceId: id, detail: status ?? 'update' })
  return NextResponse.json(updated)
}
