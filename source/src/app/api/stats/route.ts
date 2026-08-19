// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/stats — dados REAIS para o dashboard (sem métricas fake)
export async function GET() {
  const ctx = await getOperationalContext('/')

  if (ctx.role === 'CLIENT' && ctx.clientId) {
    const [projects, versions, invoices] = await Promise.all([
      db.project.findMany({
        where: { clientId: ctx.clientId },
        include: { versions: true },
        orderBy: { updatedAt: 'desc' },
      }),
      db.version.findMany({
        where: { project: { clientId: ctx.clientId } },
        orderBy: { createdAt: 'desc' },
      }),
      db.invoice.findMany({ where: { clientId: ctx.clientId } }),
    ])
    const inReview = versions.filter((v) => v.status === 'review').length
    const outstanding = invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0)
    return NextResponse.json({
      role: 'CLIENT',
      clientName: ctx.clientName,
      activeProjects: projects.filter((p) => !['Delivered', 'Archived'].includes(p.status)).length,
      versionsInReview: inReview,
      outstandingBalance: outstanding,
      recentProjects: projects.slice(0, 5),
    })
  }

  const [
    clientsCount,
    activeProjects,
    pendingTasks,
    versionsInReview,
    pluginsInstalled,
    pluginsTotal,
    outstandingInvoices,
    recentActivity,
    upcomingDeadlines,
    projectsByStatus,
    automationsTotal,
    automationsActive,
    chainsTotal,
  ] = await Promise.all([
    db.client.count(),
    db.project.count({ where: { status: { notIn: ['Delivered', 'Archived'] } } }),
    db.task.count({ where: { status: { in: ['todo', 'in_progress', 'blocked'] } } }),
    db.version.count({ where: { status: 'review' } }),
    db.plugin.count({ where: { status: 'installed' } }),
    db.plugin.count(),
    db.invoice.findMany({ where: { status: { in: ['sent', 'overdue'] } } }),
    db.activity.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { actor: true, project: true } }),
    db.project.findMany({
      where: { deadline: { gte: new Date() }, status: { notIn: ['Delivered', 'Archived'] } },
      take: 5,
      orderBy: { deadline: 'asc' },
      include: { client: true },
    }),
    db.project.groupBy({ by: ['status'], _count: true }),
    db.automation.count(),
    db.automation.count({ where: { enabled: true } }),
    db.processingChain.count(),
  ])

  const outstanding = outstandingInvoices.reduce((s, i) => s + i.amount, 0)

  return NextResponse.json({
    role: ctx.role,
    clientsCount,
    activeProjects,
    pendingTasks,
    versionsInReview,
    pluginsInstalled,
    pluginsTotal,
    outstanding,
    outstandingCount: outstandingInvoices.length,
    recentActivity,
    upcomingDeadlines,
    projectsByStatus,
    automationsTotal,
    automationsActive,
    chainsTotal,
    isDemo: ctx.isDemo,
  })
}
