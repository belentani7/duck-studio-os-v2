// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { runScheduledChecks } from '@/lib/automation'
import { db } from '@/lib/db'
import { audit } from '@/lib/context'

// POST /api/cron/checks — endpoint para checks agendados (task_overdue + invoice_overdue)
// Em produção, este endpoint seria chamado por um cron job externo (ex: a cada hora).
export async function POST(req: Request) {
  // Token simples para evitar acesso público (em produção: segredo real)
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const expected = process.env.CRON_TOKEN || 'duck-rnf-cron-2026'
  if (token !== expected) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const before = {
    overdueTasks: await db.task.count({ where: { dueDate: { lt: new Date() }, status: { in: ['todo', 'in_progress'] } } }),
    overdueInvoices: await db.invoice.count({ where: { dueDate: { lt: new Date() }, status: 'sent' } }),
  }

  await runScheduledChecks()

  const after = {
    overdueTasks: await db.task.count({ where: { dueDate: { lt: new Date() }, status: { in: ['todo', 'in_progress'] } } }),
    overdueInvoices: await db.invoice.count({ where: { dueDate: { lt: new Date() }, status: 'sent' } }),
    overdueInvoicesMarked: await db.invoice.count({ where: { status: 'overdue' } }),
  }

  await audit({
    actor: 'cron',
    role: 'SYSTEM',
    action: 'cron.checks',
    resource: 'system',
    detail: `Tasks overdue: ${before.overdueTasks}, Invoices overdue: ${before.overdueInvoices} → marked: ${after.overdueInvoicesMarked}`,
    source: 'cron',
  })

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    before,
    after,
  })
}
