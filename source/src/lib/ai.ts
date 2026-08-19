// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import ZAI from 'z-ai-web-dev-sdk'
import { db } from './db'
import type { OperationalContext } from './types'

let zaiPromise: Promise<ZAI> | null = null
function getZAI() {
  if (!zaiPromise) zaiPromise = ZAI.create()
  return zaiPromise
}

/**
 * Monta o system prompt com CONTEXTO OPERACIONAL REAL.
 * O assistente sabe: quem é, qual papel, qual studio, se é demo,
 * quais capacidades existem e o que pode/c não pode fazer.
 * NUNCA deve alucinar operações que não podem ser executadas.
 */
function buildSystemPrompt(ctx: OperationalContext, snapshot: StudioSnapshot): string {
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário do Estúdio (Owner/Admin)',
    ENGINEER: 'Engenheiro de Estúdio (Operador)',
    COLLABORATOR: 'Colaborador Externo',
    CLIENT: 'Cliente do Estúdio',
  }

  const capLines = ctx.capabilities
    .map((c) => `- ${c.key}: ${c.healthy ? '✅ saudável' : '❌ indisponível'}${c.reason ? ` (${c.reason})` : ''}`)
    .join('\n')

  const isClient = ctx.role === 'CLIENT'

  return `Você é o "DUCK", o assistente operacional do DUCK STUDIO OS — RnF (Ritmo & Frequência), um sistema de gestão de estúdio musical.

# CONTEXTO OPERACIONAL ATUAL (fonte da verdade)
- Usuário: ${ctx.userName}
- Papel: ${roleLabels[ctx.role] ?? ctx.role}
- Studio: ${ctx.studioName}${ctx.isDemo ? ' (DEMO WORKSPACE)' : ''}
- Bridge desktop: ${ctx.isDesktopBridge ? 'conectado' : 'NÃO conectado (executando em navegador)'}
${ctx.clientName ? `- Cliente em foco: ${ctx.clientName}` : ''}

# CAPACIDADES REAIS DO SISTEMA
${capLines}

# PERMISSÕES DO USUÁRIO
${ctx.permissions.join(', ')}

# SNAPSHOT DE DADOS REAIS (não inventar além disto)
${snapshot.text}

# REGRAS OBRIGATÓRIAS (PRINCÍPIO DE REALIDADE)
1. Responda SEMPRE em português do Brasil (pt-BR), exceto se o usuário pedir outro idioma.
2. Você é ${isClient ? 'o assistente do CLIENTE' : 'o assistente interno do estúdio'}. Nunca confunda os papéis: ${
    isClient
      ? 'trate o usuário como CLIENTE, foque em SEUS projetos, versões e aprovações.'
      : 'trate o usuário como operador interno (owner/engineer), com visão completa do estúdio.'
  }
3. NUNCA afirme ter executado uma operação (ex: "exportei o master", "instalei o plugin") que não pode ser feita. Se não há bridge desktop, diga explicitamente que a ação requer o companion local.
4. Distinga sempre: informação armazenada vs inferida vs ação realizada vs ação proposta vs ação impossível.
5. Para ações que envolvam dados reais (criar tarefa, mudar status), oriente o usuário a usar a interface correspondente ou diga que pode ajudar a preparar, mas não execute efeitos colaterais que você não consegue verificar.
6. Se os dados estiverem vazios para algum domínio, diga "ainda não há dados" — NUNCA invente números, clientes ou projetos.
7. Seja conciso, profissional e direto. Use listas curtas quando útil.
8. Como assistente de um estúdio musical, você pode dar dicas técnicas de mastering/mix (loudness, true-peak, EQ) quando perguntado, baseando-se nas preferências conhecidas do cliente quando houver.

# TOM
Calmo, confiante, técnico quando precisa. O dono se chama Duck. Não bajule. Se algo está quebrado ou indisponível, diga com clareza.`
}

interface StudioSnapshot {
  text: string
}

async function buildSnapshot(ctx: OperationalContext): Promise<StudioSnapshot> {
  const lines: string[] = []

  if (ctx.role === 'CLIENT' && ctx.clientId) {
    const projects = await db.project.findMany({
      where: { clientId: ctx.clientId },
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    })
    lines.push(`## Projetos do cliente (${projects.length})`)
    for (const p of projects) {
      const inReview = p.versions.filter((v) => v.status === 'review').length
      lines.push(`- "${p.name}" — status: ${p.status} | serviço: ${p.service} | versões em revisão: ${inReview}`)
    }
    const invoices = await db.invoice.findMany({ where: { clientId: ctx.clientId } })
    lines.push(`## Faturas do cliente (${invoices.length})`)
    for (const i of invoices) lines.push(`- ${i.number}: €${i.amount} — ${i.status}`)
  } else {
    const [clients, projects, tasks, plugins, invoices] = await Promise.all([
      db.client.count(),
      db.project.findMany({ take: 8, orderBy: { updatedAt: 'desc' }, include: { client: true } }),
      db.task.findMany({ where: { status: { in: ['todo', 'in_progress', 'blocked'] } }, take: 8, include: { project: true } }),
      db.plugin.count(),
      db.invoice.findMany({ where: { status: 'sent' } }),
    ])
    lines.push(`## Visão geral do estúdio`)
    lines.push(`- Clientes: ${clients}`)
    lines.push(`- Projetos: ${projects.length} (mostrando os ${Math.min(8, projects.length)} mais recentes)`)
    lines.push(`- Plugins no registry: ${plugins}`)
    lines.push(`- Faturas em aberto: ${invoices.length}`)
    lines.push(`## Projetos recentes`)
    for (const p of projects) lines.push(`- "${p.name}" (${p.client?.name}) — ${p.status}`)
    lines.push(`## Tarefas pendentes`)
    for (const t of tasks) lines.push(`- [${t.priority}] ${t.title}${t.project ? ` (${t.project.name})` : ''} — ${t.status}`)
  }

  return { text: lines.join('\n') }
}

export interface AssistantReply {
  content: string
  contextSummary: string
  capabilitiesHealthy: number
  capabilitiesTotal: number
}

export async function askAssistant(
  ctx: OperationalContext,
  history: { role: string; content: string }[],
  userMessage: string,
): Promise<AssistantReply> {
  const snapshot = await buildSnapshot(ctx)
  const systemPrompt = buildSystemPrompt(ctx, snapshot)

  const messages = [
    { role: 'assistant', content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })
    const content = completion.choices[0]?.message?.content ?? 'Não consegui processar a resposta.'
    return {
      content,
      contextSummary: snapshot.text.slice(0, 240),
      capabilitiesHealthy: ctx.capabilities.filter((c) => c.healthy).length,
      capabilitiesTotal: ctx.capabilities.length,
    }
  } catch (err) {
    // Fallback: CRM/Studio OS continua funcionando sem IA.
    return {
      content:
        '⚠️ Não consegui conectar ao serviço de IA agora. O DUCK STUDIO OS continua totalmente operacional — você pode usar CRM, projetos, versões e plugins normalmente. Detalhe técnico: ' +
        (err instanceof Error ? err.message : 'erro desconhecido'),
      contextSummary: snapshot.text.slice(0, 240),
      capabilitiesHealthy: ctx.capabilities.filter((c) => c.healthy).length,
      capabilitiesTotal: ctx.capabilities.length,
    }
  }
}
