// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/assistant/context — contexto operacional exposto ao widget (sem segredos)
export async function GET() {
  const ctx = await getOperationalContext('/')
  const conversation = await db.conversation.findFirst({
    where: { userId: ctx.userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
  })
  return NextResponse.json({
    role: ctx.role,
    userName: ctx.userName,
    studioName: ctx.studioName,
    isDemo: ctx.isDemo,
    clientName: ctx.clientName,
    capabilitiesHealthy: ctx.capabilities.filter((c) => c.healthy).length,
    capabilitiesTotal: ctx.capabilities.length,
    isDesktopBridge: ctx.isDesktopBridge,
    conversation,
  })
}
