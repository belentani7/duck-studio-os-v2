// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// PATCH /api/plugins/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/plugins')
  const { id } = await params
  if (!can(ctx.role, 'plugins:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { status, favorite, notes, category, tags, officialUrl } = body
  const updated = await db.plugin.update({
    where: { id },
    data: { status, favorite, notes, category, tags, officialUrl },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'plugin.update', resource: 'plugin', resourceId: id, detail: status ?? 'update' })
  return NextResponse.json(updated)
}
