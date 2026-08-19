// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// GET /api/plugins — registry verificável (NÃO simula instalação)
export async function GET() {
  const ctx = await getOperationalContext('/plugins')
  if (!can(ctx.role, 'plugins:view')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const plugins = await db.plugin.findMany({
    include: { installations: true },
    orderBy: [{ favorite: 'desc' }, { name: 'asc' }],
  })
  return NextResponse.json({ plugins, desktopBridge: ctx.isDesktopBridge, scannerAvailable: ctx.capabilities.find((c) => c.key === 'pluginScanner.available') })
}

// POST /api/plugins — adicionar plugin ao registry
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/plugins')
  if (!can(ctx.role, 'plugins:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { name, developer, version, format, category, tags, officialUrl, notes, status, favorite } = body
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const plugin = await db.plugin.create({
    data: { name, developer: developer ?? '', version: version ?? '1.0', format: format ?? 'VST3', category: category ?? 'Mastering', tags: tags ?? '', officialUrl, notes, status: status ?? 'known', favorite: favorite ?? false },
  })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'plugin.create', resource: 'plugin', resourceId: plugin.id, detail: name })
  return NextResponse.json(plugin, { status: 201 })
}
