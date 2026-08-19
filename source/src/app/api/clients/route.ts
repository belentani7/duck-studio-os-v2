// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/clients — Owner/Engineer vê todos; Cliente vê só o seu
export async function GET() {
  const ctx = await getOperationalContext('/crm')

  if (ctx.role === 'CLIENT') {
    if (!ctx.clientId) return NextResponse.json([])
    const self = await db.client.findUnique({
      where: { id: ctx.clientId },
      include: { projects: true, invoices: true, histories: true },
    })
    return NextResponse.json(self ? [self] : [])
  }

  const clients = await db.client.findMany({
    include: {
      projects: { select: { id: true, name: true, status: true } },
      invoices: { select: { id: true, amount: true, status: true } },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

// POST /api/clients — criar cliente (OWNER/ENGINEER)
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/crm')
  if (!can(ctx.role, 'crm:create')) {
    return NextResponse.json({ error: 'Sem permissão para criar clientes' }, { status: 403 })
  }
  const body = await req.json()
  const { name, email, phone, company, artistName, tags, notes } = body
  if (!name || !email) {
    return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
  }

  const client = await db.client.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      company: company ?? null,
      artistName: artistName ?? null,
      tags: tags ?? '',
      notes: notes ?? null,
      ownerId: ctx.userId,
    },
  })
  await db.clientHistory.create({ data: { clientId: client.id, event: 'created', detail: `Cliente criado por ${ctx.userName}` } })
  await db.activity.create({ data: { actorId: ctx.userId, action: 'create', resource: 'client', resourceId: client.id, detail: `Criou cliente ${name}` } })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'client.create', resource: 'client', resourceId: client.id, detail: name })
  return NextResponse.json(client, { status: 201 })
}
