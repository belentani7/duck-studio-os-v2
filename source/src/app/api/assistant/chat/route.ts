// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'
import { can } from '@/lib/permissions'
import { askAssistant } from '@/lib/ai'

// POST /api/assistant/chat
// Body: { message: string, conversationId?: string }
export async function POST(req: Request) {
  const ctx = await getOperationalContext('/')
  if (!can(ctx.role, 'assistant:use')) {
    return NextResponse.json({ error: 'Sem permissão para o assistente' }, { status: 403 })
  }
  const body = await req.json()
  const { message, conversationId } = body as { message: string; conversationId?: string }
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  }

  // Cria ou reutiliza conversa persistente
  let conv = conversationId ? await db.conversation.findUnique({ where: { id: conversationId }, include: { messages: { orderBy: { createdAt: 'asc' } } } }) : null
  if (!conv) {
    conv = await db.conversation.create({ data: { userId: ctx.userId, title: message.slice(0, 40), scope: ctx.role === 'CLIENT' ? 'client' : 'user' }, include: { messages: true } })
  }

  // Salva mensagem do usuário
  await db.message.create({ data: { conversationId: conv.id, role: 'user', content: message } })

  const history = conv.messages.map((m) => ({ role: m.role, content: m.content }))

  // Chama a IA com contexto operacional real
  const reply = await askAssistant(ctx, history, message)

  // Salva resposta do assistente
  await db.message.create({ data: { conversationId: conv.id, role: 'assistant', content: reply.content } })

  return NextResponse.json({
    conversationId: conv.id,
    content: reply.content,
    contextSummary: reply.contextSummary,
    capabilities: { healthy: reply.capabilitiesHealthy, total: reply.capabilitiesTotal },
    role: ctx.role,
    userName: ctx.userName,
  })
}
