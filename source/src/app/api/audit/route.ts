// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/audit
export async function GET() {
  const ctx = await getOperationalContext('/audit')
  if (!can(ctx.role, 'audit:view')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json(logs)
}
