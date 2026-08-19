// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/chains — lista cadeias de processamento
export async function GET() {
  const ctx = await getOperationalContext('/chains')
  const chains = await db.processingChain.findMany({ orderBy: [{ favorite: 'desc' }, { name: 'asc' }] })
  return NextResponse.json(chains)
}

// POST /api/chains — criar cadeia
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/chains')
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, category, genre, description, steps, favorite } = body
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (steps) { try { JSON.parse(steps) } catch { return NextResponse.json({ error: 'steps deve ser JSON válido' }, { status: 400 }) } }

  const chain = await db.processingChain.create({
    data: { name, category: category ?? 'mastering', genre: genre ?? null, description: description ?? null, steps: steps ?? '[]', favorite: favorite ?? false },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'chain.create', resource: 'chain', resourceId: chain.id, detail: name })
  return NextResponse.json(chain, { status: 201 })
}
