// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { db } from './db'

/**
 * Motor de automação real.
 * Avalia automações habilitadas para um trigger e executa a ação correspondente.
 * Registra cada execução em AutomationRun + atualiza contador.
 *
 * Tipos de trigger:
 * - project_status_change  (payload: { projectId, from, to })
 * - file_uploaded          (payload: { projectId, fileId, uploadedBy })
 * - version_created        (payload: { projectId, versionId })
 * - version_approved       (payload: { projectId, versionId })
 * - version_request_changes(payload: { projectId, versionId, note })
 * - task_overdue           (payload: { taskId })
 * - invoice_overdue        (payload: { invoiceId })
 *
 * Tipos de ação:
 * - notify_owner   (cria notificação para o owner)
 * - notify_client  (cria notificação para o cliente do projeto)
 * - create_task    (cria uma tarefa no projeto)
 * - set_status     (muda status do projeto)
 * - create_invoice (cria fatura)
 */

export interface TriggerPayload {
  projectId?: string
  from?: string
  to?: string
  fileId?: string
  versionId?: string
  taskId?: string
  invoiceId?: string
  note?: string
  uploadedBy?: string
}

interface AutomationAction {
  type: 'notify_owner' | 'notify_client' | 'create_task' | 'set_status' | 'create_invoice'
  payload?: Record<string, unknown>
}

interface AutomationCondition {
  field: string
  equals?: string
  contains?: string
}

export async function runAutomations(trigger: string, payload: TriggerPayload): Promise<void> {
  try {
    const automations = await db.automation.findMany({ where: { trigger, enabled: true } })
    if (automations.length === 0) return

    // Resolve projeto + cliente para contexto
    let project: { id: string; clientId: string | null; name: string | null } | null = null
    if (payload.projectId) {
      project = await db.project.findUnique({ where: { id: payload.projectId }, select: { id: true, clientId: true, name: true } })
    }

    for (const auto of automations) {
      // Avalia condição
      let conditionMet = true
      if (auto.condition) {
        try {
          const cond = JSON.parse(auto.condition) as AutomationCondition
          const value = resolveField(cond.field, payload, project)
          if (cond.equals !== undefined && value !== cond.equals) conditionMet = false
          if (cond.contains !== undefined && !(value ?? '').includes(cond.contains)) conditionMet = false
        } catch {
          conditionMet = false
        }
      }

      if (!conditionMet) {
        await db.automationRun.create({ data: { automationId: auto.id, status: 'skipped', detail: 'Condição não atendida' } })
        continue
      }

      // Executa ação
      let action: AutomationAction
      try {
        action = JSON.parse(auto.action) as AutomationAction
      } catch {
        await db.automationRun.create({ data: { automationId: auto.id, status: 'failed', detail: 'Ação inválida (JSON malformado)' } })
        continue
      }

      const result = await executeAction(action, payload, project)
      await db.automation.update({ where: { id: auto.id }, data: { runs: { increment: 1 }, lastRunAt: new Date() } })
      await db.automationRun.create({ data: { automationId: auto.id, status: result.ok ? 'success' : 'failed', detail: result.detail } })
    }
  } catch (e) {
    // automação nunca deve quebrar o fluxo principal
    console.error('[automation] error:', e instanceof Error ? e.message : e)
  }
}

function resolveField(field: string, payload: TriggerPayload, project: any): string | undefined {
  if (field === 'to' || field === 'status') return payload.to
  if (field === 'from') return payload.from
  if (field === 'projectName') return project?.name ?? undefined
  return (payload as Record<string, string | undefined>)[field]
}

async function executeAction(action: AutomationAction, payload: TriggerPayload, project: any): Promise<{ ok: boolean; detail: string }> {
  try {
    switch (action.type) {
      case 'notify_owner': {
        const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
        if (!owner) return { ok: false, detail: 'Owner não encontrado' }
        await db.notification.create({
          data: {
            userId: owner.id,
            type: 'project',
            title: `Automação: ${action.payload?.title ?? 'Notificação'}${project ? ` · ${project.name}` : ''}`,
            body: (action.payload?.body as string) ?? `Trigger: ${payload.to ?? ''}`,
            read: false,
          },
        })
        return { ok: true, detail: 'Owner notificado' }
      }
      case 'notify_client': {
        if (!project?.clientId) return { ok: false, detail: 'Sem cliente vinculado' }
        const clientUser = await db.user.findFirst({ where: { clientId: project.clientId } })
        if (!clientUser) return { ok: false, detail: 'Usuário cliente não encontrado' }
        await db.notification.create({
          data: {
            userId: clientUser.id,
            type: 'project',
            title: `Automação: ${action.payload?.title ?? 'Atualização'}${project ? ` · ${project.name}` : ''}`,
            body: (action.payload?.body as string) ?? '',
            read: false,
          },
        })
        return { ok: true, detail: 'Cliente notificado' }
      }
      case 'create_task': {
        if (!project) return { ok: false, detail: 'Sem projeto' }
        await db.task.create({
          data: {
            projectId: project.id,
            title: (action.payload?.title as string) ?? 'Tarefa automática',
            priority: (action.payload?.priority as string) ?? 'medium',
            status: 'todo',
          },
        })
        return { ok: true, detail: 'Tarefa criada' }
      }
      case 'set_status': {
        if (!project) return { ok: false, detail: 'Sem projeto' }
        const status = (action.payload?.status as string) ?? payload.to ?? 'In Production'
        await db.project.update({ where: { id: project.id }, data: { status } })
        return { ok: true, detail: `Status → ${status}` }
      }
      case 'create_invoice': {
        if (!project?.clientId) return { ok: false, detail: 'Sem cliente' }
        const count = await db.invoice.count()
        await db.invoice.create({
          data: {
            clientId: project.clientId,
            projectId: project.id,
            number: `RNF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
            amount: Number(action.payload?.amount ?? 0),
            status: 'draft',
          },
        })
        return { ok: true, detail: 'Fatura criada' }
      }
      default:
        return { ok: false, detail: `Tipo de ação desconhecido: ${action.type}` }
    }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'Erro na execução' }
  }
}

/** Faz um scan periódico de tarefas/faturas vencidas e dispara triggers. */
export async function runScheduledChecks(): Promise<void> {
  const now = new Date()
  // Tarefas vencidas
  const overdueTasks = await db.task.findMany({ where: { dueDate: { lt: now }, status: { in: ['todo', 'in_progress'] } } })
  for (const t of overdueTasks) {
    await runAutomations('task_overdue', { taskId: t.id, projectId: t.projectId ?? undefined })
  }
  // Faturas vencidas
  const overdueInvoices = await db.invoice.findMany({ where: { dueDate: { lt: now }, status: 'sent' } })
  for (const inv of overdueInvoices) {
    await db.invoice.update({ where: { id: inv.id }, data: { status: 'overdue' } })
    await runAutomations('invoice_overdue', { invoiceId: inv.id, projectId: inv.projectId ?? undefined })
  }
}
