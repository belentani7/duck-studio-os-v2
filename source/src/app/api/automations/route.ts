// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'
import { runAutomations } from '@/lib/automation'

// GET /api/automations — lista automações + runs recentes
export async function GET() {
  const ctx = await getOperationalContext('/automations')
  if (!can(ctx.role, 'automation:view') && !can(ctx.role, 'studio:view')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const automations = await db.automation.findMany({
    include: { runLogs: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(automations)
}

// POST /api/automations — criar automação
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/automations')
  if (!can(ctx.role, 'studio:settings')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, trigger, condition, action, enabled } = body
  if (!name || !trigger || !action) {
    return NextResponse.json({ error: 'name, trigger e action obrigatórios' }, { status: 400 })
  }
  // Valida que action é JSON válido
  try { JSON.parse(action) } catch { return NextResponse.json({ error: 'action deve ser JSON válido' }, { status: 400 }) }
  if (condition) { try { JSON.parse(condition) } catch { return NextResponse.json({ error: 'condition deve ser JSON válido' }, { status: 400 }) } }

  const auto = await db.automation.create({
    data: { name, trigger, condition: condition ?? null, action, enabled: enabled ?? true },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'automation.create', resource: 'automation', resourceId: auto.id, detail: name })
  return NextResponse.json(auto, { status: 201 })
}
