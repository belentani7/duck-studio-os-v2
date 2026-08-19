// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/notifications — do usuário atual
export async function GET() {
  const ctx = await getOperationalContext('/')
  const notes = await db.notification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(notes)
}

// PATCH /api/notifications — marcar como lida
export async function PATCH(req: Request) {
  const ctx = await getOperationalContext('/')
  const body = await req.json()
  const { id, read, markAllRead } = body
  if (markAllRead) {
    await db.notification.updateMany({ where: { userId: ctx.userId, read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  if (id) {
    const updated = await db.notification.update({ where: { id }, data: { read: read ?? true } })
    return NextResponse.json(updated)
  }
  return NextResponse.json({ error: 'id ou markAllRead obrigatório' }, { status: 400 })
}
