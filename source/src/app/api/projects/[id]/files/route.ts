// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, audit } from '@/lib/context'
import { can } from '@/lib/permissions'
import { runAutomations } from '@/lib/automation'

// GET /api/projects/[id]/files
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { clientId: true } })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const files = await db.fileAsset.findMany({
    where: { projectId: id },
    include: { uploadedBy: true, track: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(files)
}

// POST /api/projects/[id]/files — registra metadados de arquivo (sem armazenar binário em navegador)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOperationalContext('/projects')
  const { id } = await params
  if (!can(ctx.role, 'files:upload')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const project = await db.project.findUnique({ where: { id }, select: { clientId: true, name: true } })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (ctx.role === 'CLIENT' && project.clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const body = await req.json()
  const { name, category, mime, size, trackId } = body
  if (!name) return NextResponse.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 })

  const file = await db.fileAsset.create({
    data: {
      projectId: id,
      trackId: trackId ?? null,
      name,
      category: category ?? '01_SOURCE',
      mime: mime ?? 'audio/wav',
      size: size ?? 0,
      status: 'uploaded',
      uploadedById: ctx.userId,
    },
  })
  await db.activity.create({ data: { actorId: ctx.userId, projectId: id, action: 'upload', resource: 'file', resourceId: file.id, detail: `${ctx.userName} registrou arquivo ${name}` } })

  // Se cliente subir arquivo, notifica o owner
  if (ctx.role === 'CLIENT') {
    const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
    if (owner) {
      await db.notification.create({ data: { userId: owner.id, type: 'project', title: `${ctx.userName} subiu um arquivo em "${project.name}"`, body: name, read: false } })
    }
  }
  // Dispara automações de upload de arquivo
  void runAutomations('file_uploaded', { projectId: id, fileId: file.id, uploadedBy: ctx.userId })
  await audit({ actor: ctx.userName, role: ctx.role, action: 'file.upload', resource: 'file', resourceId: file.id, detail: name })
  return NextResponse.json(file, { status: 201 })
}
