// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'

// Default mastering QC checklist template (PT-BR)
const DEFAULT_QC_TEMPLATE = [
  { label: 'Sample rate correto (44.1/48/88.2/96 kHz)', category: 'format', order: 0 },
  { label: 'Bit depth correto (24bit ou superior na fonte)', category: 'format', order: 1 },
  { label: 'Formato de entrega confirmado (WAV/AIFF)', category: 'format', order: 2 },
  { label: 'Canais e stereo image verificados', category: 'format', order: 3 },
  { label: 'True peak abaixo de -1.0 dBTP', category: 'levels', order: 4 },
  { label: 'Loudness dentro do alvo (-9 a -14 LUFS conforme plataforma)', category: 'levels', order: 5 },
  { label: 'Sem clipping digital audível', category: 'levels', order: 6 },
  { label: 'RMS consistente entre faixas (álbum)', category: 'levels', order: 7 },
  { label: 'Fades de início e fim corretos', category: 'fades', order: 8 },
  { label: 'Sem silêncio excessivo no início/fim', category: 'fades', order: 9 },
  { label: 'Clique/skip verificado em transições', category: 'fades', order: 10 },
  { label: 'Metadados ISRC/UPC preenchidos (se aplicável)', category: 'metadata', order: 11 },
  { label: 'Tags de artista/título/álbum corretas', category: 'metadata', order: 12 },
  { label: 'Capa/embedded artwork verificada', category: 'metadata', order: 13 },
  { label: 'Nomenclatura de arquivo conforme padrão', category: 'delivery', order: 14 },
  { label: 'Arquivo master final renderizado', category: 'delivery', order: 15 },
  { label: 'Checksum/hash gerado para entrega', category: 'delivery', order: 16 },
  { label: 'Cliente notificado da entrega', category: 'delivery', order: 17 },
  { label: 'Balanceamento tonal revisado (low/mid/high)', category: 'artistic', order: 18 },
  { label: 'Referência A/B comparada', category: 'artistic', order: 19 },
]

// GET /api/projects/[id]/qc — returns checklist (auto-creates default if empty)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { clientId: true } })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let items = await db.qcItem.findMany({ where: { projectId: id }, orderBy: { order: 'asc' } })
  // Auto-create default template if empty
  if (items.length === 0) {
    await db.qcItem.createMany({
      data: DEFAULT_QC_TEMPLATE.map((t) => ({ ...t, projectId: id })),
    })
    items = await db.qcItem.findMany({ where: { projectId: id }, orderBy: { order: 'asc' } })
  }
  return NextResponse.json({ items, template: DEFAULT_QC_TEMPLATE })
}

// PATCH /api/projects/[id]/qc — toggle/update a single item
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { itemId, checked, notes } = body
  if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

  const updated = await db.qcItem.update({
    where: { id: itemId },
    data: { checked, notes },
  })
  if (checked) {
    await db.activity.create({
      data: { actorId: ctx.userId, projectId: id, action: 'qc_check', resource: 'qcitem', resourceId: itemId, detail: `${ctx.userName} marcou QC: ${updated.label}` },
    })
  }
  await audit({ actor: ctx.userName, role: ctx.role, action: 'qc.update', resource: 'qcitem', resourceId: itemId, detail: `${checked ? 'checked' : 'unchecked'}: ${updated.label}` })
  return NextResponse.json(updated)
}

// POST /api/projects/[id]/qc — add custom item
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  if (!can(ctx.role, 'projects:edit')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const body = await req.json()
  const { label, category } = body
  if (!label) return NextResponse.json({ error: 'label obrigatório' }, { status: 400 })
  const count = await db.qcItem.count({ where: { projectId: id } })
  const item = await db.qcItem.create({
    data: { projectId: id, label, category: category ?? 'general', order: count },
  })
  return NextResponse.json(item, { status: 201 })
}
