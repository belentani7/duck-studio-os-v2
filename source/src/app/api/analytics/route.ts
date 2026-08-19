// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/analytics — métricas reais para gráficos (owner/engineer only)
export async function GET() {
  const ctx = await getOperationalContext('/analytics')
  if (ctx.role === 'CLIENT') {
    return NextResponse.json({ error: 'Sem acesso a analytics' }, { status: 403 })
  }

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)

  // Revenue por mês (faturas pagas no ano)
  const paidInvoices = await db.invoice.findMany({
    where: { status: 'paid', createdAt: { gte: yearStart } },
    select: { amount: true, currency: true, createdAt: true },
  })
  const revenueByMonth = Array.from({ length: 12 }).map((_, i) => {
    const monthInvoices = paidInvoices.filter((inv) => new Date(inv.createdAt).getMonth() === i)
    return {
      month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
      revenue: monthInvoices.reduce((s, inv) => s + inv.amount, 0),
      count: monthInvoices.length,
    }
  })

  // Projects por status (pie)
  const projectsByStatus = await db.project.groupBy({ by: ['status'], _count: true })

  // Projects por serviço (bar)
  const projectsByService = await db.project.groupBy({ by: ['service'], _count: true })

  // Top clientes por número de projetos
  const topClients = await db.client.findMany({
    include: { _count: { select: { projects: true } }, projects: { select: { price: true } } },
    take: 5,
    orderBy: { projects: { _count: 'desc' } },
  })
  const topClientsStats = topClients.map((c) => ({
    name: c.name,
    projects: c._count.projects,
    revenue: c.projects.reduce((s, p) => s + p.price, 0),
  }))

  // Task completion rate
  const [tasksDone, tasksTotal] = await Promise.all([
    db.task.count({ where: { status: 'done' } }),
    db.task.count(),
  ])

  // Version approval rate
  const [versionsApproved, versionsTotal] = await Promise.all([
    db.version.count({ where: { status: 'approved' } }),
    db.version.count(),
  ])

  // Plugin distribution
  const pluginsByStatus = await db.plugin.groupBy({ by: ['status'], _count: true })

  // Recent activity trend (últimos 7 dias)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const recentActivity = await db.activity.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, action: true },
  })
  const activityByDay = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(now.getTime() - (6 - i) * 86400000)
    const dayActivities = recentActivity.filter((a) => {
      const ad = new Date(a.createdAt)
      return ad.getDate() === day.getDate() && ad.getMonth() === day.getMonth()
    })
    return {
      day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()],
      activities: dayActivities.length,
    }
  })

  return NextResponse.json({
    revenueByMonth,
    projectsByStatus,
    projectsByService,
    topClients: topClientsStats,
    taskCompletionRate: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0,
    tasksDone,
    tasksTotal,
    versionApprovalRate: versionsTotal > 0 ? Math.round((versionsApproved / versionsTotal) * 100) : 0,
    versionsApproved,
    versionsTotal,
    pluginsByStatus,
    activityByDay,
  })
}
